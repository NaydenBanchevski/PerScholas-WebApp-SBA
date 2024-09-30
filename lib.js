// Function to format the response text
export function formatResponse(text) {
  const highImportanceKeywords = [
    "class",
    "function",
    "return",
    "await",
    "async",
    "if",
    "for",
    "while",
    "switch",
    "case",
    "break",
    "continue",
    "throw",
    "try",
    "catch",
  ];
  const mediumImportanceKeywords = [
    "const",
    "let",
    "var",
    "new",
    "extends",
    "super",
    "this",
    "instanceof",
    "import",
    "export",
    "debugger",
    "default",
  ];
  const lowImportanceKeywords = [
    "do",
    "else",
    "finally",
    "in",
    "of",
    "yield",
    "typeof",
    "void",
    "with",
  ];

  const highImportancePattern = new RegExp(
    `\\b(${highImportanceKeywords.join("|")})\\b`,
    "g"
  );
  const mediumImportancePattern = new RegExp(
    `\\b(${mediumImportanceKeywords.join("|")})\\b`,
    "g"
  );
  const lowImportancePattern = new RegExp(
    `\\b(${lowImportanceKeywords.join("|")})\\b`,
    "g"
  );

  function highlightCode(code) {
    code = code.replace(
      highImportancePattern,
      '<span class="keyword high-importance">$1</span>'
    );
    code = code.replace(
      mediumImportancePattern,
      '<span class="keyword medium-importance">$1</span>'
    );
    code = code.replace(
      lowImportancePattern,
      '<span class="keyword low-importance">$1</span>'
    );
    return code;
  }

  // Replace code blocks (e.g., ```code```)
  text = text.replace(/```([\s\S]*?)```/g, function (match, code) {
    return (
      "<pre><code>" +
      highlightCode(code.replace(/</g, "&lt;").replace(/>/g, "&gt;")) +
      "</code></pre>"
    );
  });

  // Replace inline code (e.g., "`code`")
  text = text.replace(/`([^`]+)`/g, function (match, code) {
    return (
      "<code>" +
      highlightCode(code.replace(/</g, "&lt;").replace(/>/g, "&gt;")) +
      "</code>"
    );
  });

  // Replace bullet points (e.g., "- Item")
  text = text.replace(/^\s*-\s/gm, "<br>&nbsp;&nbsp;&nbsp;&nbsp;&bull; ");

  // Replace numbered headings (e.g., "1. **Heading**")
  text = text.replace(/^(\d+)\.\s\*\*(.*?)\*\*/gm, "<strong>$1. $2</strong>");

  // Replace subheadings (e.g., "## Subheading")
  text = text.replace(/^##\s(.+)/gm, "<strong><u>$1</u></strong>");

  // Replace sub-subheadings (e.g., "### Sub-subheading")
  text = text.replace(/^###\s(.+)/gm, "<strong><em>$1</em></strong>");

  // Replace bold text (e.g., "**bold**")
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Replace italic text (e.g., "*italic*")
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Replace hyperlinks (e.g., "[text](url)")
  text = text.replace(
    /$begin:math:display$([^$end:math:display$]+)\]$begin:math:text$([^)]+)$end:math:text$/g,
    '<a href="$2" target="_blank">$1</a>'
  );

  // Replace blockquotes (e.g., "> quote")
  text = text.replace(/^>\s(.*?)/gm, "<blockquote>$1</blockquote>");

  // Replace horizontal lines (e.g., "---")
  text = text.replace(/^\s*---\s*$/gm, "<hr>");

  // Replace new lines with <br>, except inside <pre><code>
  text = text.replace(/(?<!<\/pre>)\n/g, "<br>");

  return text;
}
