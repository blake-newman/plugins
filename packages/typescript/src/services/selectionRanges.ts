import { SharedContext } from '../types';
import type * as ts from 'typescript/lib/tsserverlibrary';
import * as vscode from 'vscode-languageserver-protocol';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { safeCall } from '../shared';

export function register(ctx: SharedContext) {
	return (uri: string, positions: vscode.Position[]): vscode.SelectionRange[] => {

		const document = ctx.getTextDocument(uri);
		if (!document) return [];

		const result: vscode.SelectionRange[] = [];

		for (const position of positions) {
			const fileName = ctx.uriToFileName(document.uri);
			const offset = document.offsetAt(position);
			const range = safeCall(() => ctx.typescript.languageService.getSmartSelectionRange(fileName, offset));
			if (!range) continue;

			result.push(transformSelectionRange(range, document));
		}

		return result;
	};
}

function transformSelectionRange(range: ts.SelectionRange, document: TextDocument): vscode.SelectionRange {
	return {
		range: vscode.Range.create(
			document.positionAt(range.textSpan.start),
			document.positionAt(range.textSpan.start + range.textSpan.length),
		),
		parent: range.parent ? transformSelectionRange(range.parent, document) : undefined,
	};
}
