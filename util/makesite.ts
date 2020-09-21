'use strict'

import {
	existsSync,
	readFileSync,
	writeFileSync
} from 'fs'
import {
	join as pathJoin,
	sep as pathSep
} from 'path'
import * as Hbs from 'handlebars'
import * as Sass from 'node-sass'
import * as Mkdirp from 'mkdirp'

interface Endpoint {
	ident: string
	path: string
	strict: boolean
	dep: {
		code: string[]
		style: string[]
		partial: string[]
	}
}

interface StaticFile {
	path: string
	content: string
}

let existingPartials: string[] = []

const fileExts = {
	'markup': ['.html', '.hbs'],
	'style': ['.css', '.scss', '.sass'],
	'code': ['.js']
}
const namePrefixes = {
	'markup': '',
	'style': '_style_',
	'code': '_code_'
}
const contentPrefix = {
	'markup': '',
	'style': '<style>',
	'code': '<script>'
}
const contentSuffix = {
	'markup': '',
	'style': '</style>',
	'code': '</script>'
}

const resolveExt = (filePath: string, type: string):
string => {
	let ret: string = ''
	for(let i = 0; i < fileExts[type].length; i++) {
		const ext = fileExts[type][i]
		if(existsSync(filePath + ext)) {
			if(ret !== '') {
				throw new Error('multiple files found for a single name')
			} else {
				ret = filePath + ext
			}
		}
	}
	if(ret === '') {
		throw new Error('file ‘' + filePath + '’ not found')
	}
	return ret
}

const readOrParseFile = (path: string, includePaths: string[],
compileHbs: boolean): string => {
	let ret: string
	const tmp: string[] = path.split('.')
	const ext: string = tmp[tmp.length - 1]
	if(ext === 'hbs' && compileHbs) {
		ret = Hbs.compile(readFileSync(path, 'utf-8'))({})
	} else if(ext === 'sass' || ext === 'scss') {
		ret = Sass.renderSync({
			file: path,
			includePaths,
			indentedSyntax: ext === 'sass',
			omitSourceMapUrl: true,
			outputStyle: 'compressed',
			sourceMap: false
		}).css
	} else {
		console.log('::: ' + path)
		ret = readFileSync(path, 'utf-8')
	}
	return ret
}

const readOrParsePartial = (path: string, includePaths: string[]): string => {
	return readOrParseFile(path, includePaths, false)
}

const addPartial = (name: string, partialDir: string, type: string): void => {
	const filePath = resolveExt(pathJoin(partialDir, name), type)
	const contents = contentPrefix[type] +
		readOrParsePartial(filePath, type === 'style' ? [partialDir] : []) +
		contentSuffix[type]
	const fullname = namePrefixes[type] + name
	if(existingPartials.indexOf(fullname) === -1) {
		Hbs.registerPartial(fullname, contents)
		existingPartials.push(fullname)
	}
}

const dirsFromPath = (path: string): string => {
	const tmp: string[] = path.split(pathSep)
	return tmp.slice(0, tmp.length - 1).join(pathSep)
}

const make = (srcRoot: string, dstRoot: string): void => {
	const pageDir = pathJoin(srcRoot, 'markup', 'page')
	const partialDir = pathJoin(srcRoot, 'markup', 'partial')
	const styleDir = pathJoin(srcRoot, 'style')
	const codeDir = pathJoin(srcRoot, 'code')
	const endpoints: Endpoint[] = JSON.parse(readFileSync(pathJoin(srcRoot,
		'endpoints.json'), 'utf-8'))
	for(let i = 0; i < endpoints.length; i++) {
		const endpoint = endpoints[i]
		/* parse and add all partials for markup, style and code */
		for(let j = 0; j < endpoint.dep.code.length; j++) {
			addPartial(endpoint.dep.code[j], codeDir, 'code')
		}
		for(let j = 0; j < endpoint.dep.style.length; j++) {
			addPartial(endpoint.dep.style[j], styleDir, 'style')
		}
		for(let j = 0; j < endpoint.dep.partial.length; j++) {
			addPartial(endpoint.dep.partial[j], partialDir, 'markup')
		}
		/* create and store the page info */
		const page: StaticFile = {
			path: endpoint.path.endsWith('/') ? endpoint.path + 'index.html' :
				endpoint.path,
			content: readOrParseFile(pathJoin(pageDir,
				endpoint.ident + '.hbs'), [], true)
		}
		if(page.path.startsWith('/')) {
			page.path = page.path.slice(1, page.path.length)
		}
		if(pathSep !== '/') {
			page.path = page.path.replace('/', pathSep)
		}
		const dstPath = pathJoin(dstRoot, page.path)
		Mkdirp.sync(dirsFromPath(dstPath))
		writeFileSync(dstPath, page.content)
	}
}

if(process.argv.length !== 4) {
	console.error('Usage:\n\n\tnpm run build <source root> <dest root>\n')
} else {
	make(process.argv[2], process.argv[3])
}
