module.exports =
class SnippetsProvider {
  constructor() {
    this.selector = '*'
    this.inclusionPriority = 1
    this.suggestionPriority = 2
    this.filterSuggestions = true

    this.showIcon = ['Symbol', 'Subsequence'].includes(atom.config.get('autocomplete-plus.defaultProvider'))
    this.snippetsSource = {
      snippetsForScopes(scopeDescriptor) {
        return atom.config.get('snippets', {scope: scopeDescriptor})
      }
    }
  }

  setSnippetsSource(snippetsSource) {
    if (typeof (snippetsSource != null ? snippetsSource.snippetsForScopes : undefined) === "function") {
      return this.snippetsSource = snippetsSource
    }
  }

  getSuggestions({editor, bufferPosition, scopeDescriptor}) {
    const scopeSnippets = this.snippetsSource.snippetsForScopes(scopeDescriptor)
    if (scopeSnippets == null) { return [] }
    const prefix = this.getPrefixForSnippets(scopeSnippets, editor, bufferPosition)
    if (!(prefix != null ? prefix.length : undefined)) { return }
    return this.findSuggestionsForPrefix(scopeSnippets, prefix)
  }

  /**
   * NOTE: This lets de\\scr complete to description in LaTeX;
   * Need to find a balance between special characters, and over eagerness
   * (Though users with special characters in snippets should be wary anyways)
   */
  getPrefixForSnippets(scopeSnippets, editor, bufferPosition) {
    const snippetCharacters = new Set()
    for (let snippetName in scopeSnippets) {
      for (let char of scopeSnippets[snippetName].prefix) {
        snippetCharacters.add(char)
      }
    }

    const line = editor.lineTextForBufferRow(bufferPosition.row)
    for (let i = bufferPosition.column - 1; i >= 0; i--) {
      if (!snippetCharacters.has(line.charAt(i))) {
        console.log("Prefix: ", line.slice(i + 1, bufferPosition.column));
        return line.slice(i + 1, bufferPosition.column)
      }
    }

    console.log("Prefix: ", line.slice(0, bufferPosition.column));
    return line.slice(0, bufferPosition.column)
  }

  findSuggestionsForPrefix(snippets, prefix) {
    const suggestions = []
    for (let snippetPrefix in snippets) {
      const snippet = snippets[snippetPrefix]
      if (!snippet || !snippetPrefix || !prefix || !firstCharsEqual(snippetPrefix, prefix)) { continue }
      suggestions.push({
        iconHTML: this.showIcon ? undefined : false,
        type: 'snippet',
        text: snippet.prefix,
        replacementPrefix: prefix,
        rightLabel: snippet.name,
        rightLabelHTML: snippet.rightLabelHTML,
        leftLabel: snippet.leftLabel,
        leftLabelHTML: snippet.leftLabelHTML,
        description: snippet.description,
        descriptionMoreURL: snippet.descriptionMoreURL
      })
    }

    suggestions.sort(ascendingPrefixComparator)
    return suggestions
  }

  onDidInsertSuggestion({editor}) {
    return atom.commands.dispatch(atom.views.getView(editor), 'snippets:expand')
  }
}

const ascendingPrefixComparator = (a, b) => a.text.localeCompare(b.text)

const firstCharsEqual = (str1, str2) => str1[0].toLowerCase() === str2[0].toLowerCase()
