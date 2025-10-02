import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'app-monaco-diff-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monaco-diff-editor.component.html',
  styleUrls: ['./monaco-diff-editor.component.scss']
})
export class MonacoDiffEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diffContainer', { static: true }) diffContainer!: ElementRef<HTMLDivElement>;

  private diffEditor?: monaco.editor.IStandaloneDiffEditor;
  private originalModel?: monaco.editor.ITextModel;
  private modifiedModel?: monaco.editor.ITextModel;
  private originalDecorationIds: string[] = [];
  private modifiedDecorationIds: string[] = [];

  originalText = 'hello world';
  modifiedText = 'hello worlld';

  ngAfterViewInit(): void {
    monaco.editor.defineTheme('custom-diff', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        // Added (green)
        'diffEditor.insertedTextBackground': '#00a00033',
        'diffEditor.insertedTextBorder': '#00a000',
        // Removed (red)
        'diffEditor.removedTextBackground': '#a0000033',
        'diffEditor.removedTextBorder': '#a00000'
      }
    });
    monaco.editor.setTheme('custom-diff');

    this.diffEditor = monaco.editor.createDiffEditor(this.diffContainer.nativeElement, {
      automaticLayout: true,
      renderSideBySide: true,
      theme: 'custom-diff',
      minimap: { enabled: false },
      ignoreTrimWhitespace: false,
    });

    this.originalModel = monaco.editor.createModel(this.originalText, 'plaintext');
    this.modifiedModel = monaco.editor.createModel(this.modifiedText, 'plaintext');

    this.diffEditor.setModel({ original: this.originalModel, modified: this.modifiedModel });

    const updateDecorations = () => this.applyCharChangeHighlights();
    this.diffEditor.onDidUpdateDiff(updateDecorations);
    // Initial application
    updateDecorations();
  }

  applyCharChangeHighlights(): void {
    if (!this.diffEditor || !this.originalModel || !this.modifiedModel) return;
    const lineChanges = (this.diffEditor as any).getLineChanges?.() || [];

    const originalDecorations: monaco.editor.IModelDeltaDecoration[] = [];
    const modifiedDecorations: monaco.editor.IModelDeltaDecoration[] = [];

    for (const change of lineChanges) {
      if (!change.charChanges) continue;
      for (const cc of change.charChanges) {
        if (cc.originalStartLineNumber && cc.originalEndLineNumber) {
          originalDecorations.push({
            range: new monaco.Range(
              cc.originalStartLineNumber,
              cc.originalStartColumn,
              cc.originalEndLineNumber,
              cc.originalEndColumn
            ),
            options: { inlineClassName: 'char-modified-highlight' }
          });
        }
        if (cc.modifiedStartLineNumber && cc.modifiedEndLineNumber) {
          modifiedDecorations.push({
            range: new monaco.Range(
              cc.modifiedStartLineNumber,
              cc.modifiedStartColumn,
              cc.modifiedEndLineNumber,
              cc.modifiedEndColumn
            ),
            options: { inlineClassName: 'char-modified-highlight' }
          });
        }
      }
    }

    this.originalDecorationIds = this.originalModel.deltaDecorations(this.originalDecorationIds, originalDecorations);
    this.modifiedDecorationIds = this.modifiedModel.deltaDecorations(this.modifiedDecorationIds, modifiedDecorations);
  }

  setExampleHelloWorld(): void {
    this.updateModels('hello world', 'hello worlld');
  }

  setExamplePaths(): void {
    const path = '/Users/lucasfeitozas/Dev/workspace/angular-monaco-editor-poc/editor-poc/src/app/monaco-editor/monaco-editor.component.ts';
    this.updateModels(path, path);
  }

  updateModels(original: string, modified: string): void {
    this.originalText = original;
    this.modifiedText = modified;
    this.originalModel?.setValue(original);
    this.modifiedModel?.setValue(modified);
    this.applyCharChangeHighlights();
  }

  ngOnDestroy(): void {
    this.diffEditor?.dispose();
    this.originalModel?.dispose();
    this.modifiedModel?.dispose();
    monaco.editor.getModels().forEach(m => m.dispose());
  }
}