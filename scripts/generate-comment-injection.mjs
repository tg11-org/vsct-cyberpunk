import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const destinationPath = resolve(
  process.cwd(),
  "syntaxes",
  "tg11-cyberpunk-comment-injection.tmLanguage.json"
);

const cp = String.fromCodePoint;

const lineTagPatterns = [
  {
    scope: "keyword.control.comment.special.todo",
    begin: "(?i)\\b(?:TODO|WIP|TBD)\\b"
  },
  {
    scope: "keyword.control.comment.special.note",
    begin: "(?i)\\b(?:NOTE|DOC)\\b"
  },
  {
    scope: "keyword.control.comment.special.fixme",
    begin: "(?i)\\b(?:FIXME|FIX|BROKEN|BROKE|BORKED|BORKEN|BORKE|BORK)\\b"
  },
  {
    scope: "keyword.control.comment.special.hack",
    begin: "(?i)\\b(?:TMP\\s+FIX|TEMP\\s+FIX|HACK|TEMP|TMP)\\b"
  },
  {
    scope: "keyword.control.comment.special.bug",
    begin: "(?i)\\b(?:BUG|NOTICE)\\b"
  },
  {
    scope: "keyword.control.comment.special.xxx",
    begin: "(?i)\\b(?:DANGEROUS|WARNING|DANGER|WARN|XXX)\\b"
  },
  {
    scope: "keyword.control.comment.special.nb",
    begin: "(?i)\\b(?:NOTE\\s+BENE|PAY\\s+ATTENTION|IMPORTANT|NOTA|BENE|NB)\\b"
  }
];

const lineSymbolPatterns = [
  ["keyword.control.comment.symbol.tilde", "~"],
  ["keyword.control.comment.symbol.exclamation", "!"],
  ["keyword.control.comment.symbol.at", "@"],
  ["keyword.control.comment.symbol.cash", "$"],
  ["keyword.control.comment.symbol.percent", "%"],
  ["keyword.control.comment.symbol.caret", "^"],
  ["keyword.control.comment.symbol.ampersand", "&"],
  ["keyword.control.comment.symbol.question", "?"]
];

const tokenSymbolPatterns = [
  ["keyword.control.comment.symbol.pound", "#"],
  ["keyword.control.comment.symbol.asterisk", "*"],
  ["keyword.control.comment.symbol.minus", "-"],
  ["keyword.control.comment.symbol.plus", "+"],
  ["keyword.control.comment.symbol.equals", "="],
  ["keyword.control.comment.symbol.pipe", "|"],
  ["keyword.control.comment.symbol.colon", ":"],
  ["keyword.control.comment.symbol.semicolon", ";"],
  ["keyword.control.comment.symbol.greaterthan", ">"],
  ["keyword.control.comment.symbol.backslash", "\\"],
  ["keyword.control.comment.symbol.lessthan", "<"],
  ["keyword.control.comment.symbol.grave", "`"],
  ["keyword.control.comment.symbol.section", cp(0x00a7)],
  ["keyword.control.comment.symbol.pilcrow", cp(0x00b6)],
  ["keyword.control.comment.symbol.generic", cp(0x00a4)],
  ["keyword.control.comment.symbol.single-right-pointing-angle-quote", cp(0x203a)],
  ["keyword.control.comment.symbol.single-left-pointing-angle-quote", cp(0x2039)],
  ["keyword.control.comment.symbol.double-right-pointing-angle-quote", cp(0x00bb)],
  ["keyword.control.comment.symbol.double-left-pointing-angle-quote", cp(0x00ab)],
  ["keyword.control.comment.symbol.broken-pipe", cp(0x00a6)],
  ["keyword.control.comment.symbol.multiply", cp(0x00d7)],
  ["keyword.control.comment.symbol.divide", cp(0x00f7)],
  ["keyword.control.comment.symbol.bullet", cp(0x2022)],
  ["keyword.control.comment.symbol.bullet-sharp", cp(0x2023)],
  ["keyword.control.comment.symbol.bdc-horizontal", cp(0x2500)],
  ["keyword.control.comment.symbol.bdc-vertical", cp(0x2502)],
  ["keyword.control.comment.symbol.bdc-down-right", cp(0x250c)],
  ["keyword.control.comment.symbol.bdc-down-left", cp(0x2510)],
  ["keyword.control.comment.symbol.bdc-up-right", cp(0x2514)],
  ["keyword.control.comment.symbol.bdc-up-left", cp(0x2518)],
  ["keyword.control.comment.symbol.bdc-vertical-right", cp(0x251c)],
  ["keyword.control.comment.symbol.bdc-vertical-left", cp(0x2524)],
  ["keyword.control.comment.symbol.bdc-horizontal-down", cp(0x252c)],
  ["keyword.control.comment.symbol.bdc-horizontal-up", cp(0x2534)],
  ["keyword.control.comment.symbol.bdc-vertical-horizontal", cp(0x253c)],
  ["keyword.control.comment.symbol.bdc-down-right-arc", cp(0x256d)],
  ["keyword.control.comment.symbol.bdc-down-left-arc", cp(0x256e)],
  ["keyword.control.comment.symbol.bdc-up-left-arc", cp(0x256f)],
  ["keyword.control.comment.symbol.bdc-up-right-arc", cp(0x2570)]
];

function escapeRegex(literal) {
  return literal.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
}

const nextRegionLookahead = [
  ...lineTagPatterns.map(pattern => pattern.begin),
  `(?<!\\S)(?:${lineSymbolPatterns
    .map(([, literal]) => escapeRegex(literal))
    .join("|")})`
].join("|");

const regionEnd = `(?=$|\\*/|${nextRegionLookahead})`;

const grammar = {
  scopeName: "tg11-cyberpunk.comment.injection",
  injectionSelector: "L:comment",
  patterns: [
    ...lineTagPatterns.map(pattern => ({
      begin: pattern.begin,
      beginCaptures: {
        "0": {
          name: pattern.scope
        }
      },
      end: regionEnd,
      contentName: pattern.scope
    })),
    ...lineSymbolPatterns.map(([scope, literal]) => ({
      begin: `(?<!\\S)${escapeRegex(literal)}`,
      beginCaptures: {
        "0": {
          name: scope
        }
      },
      end: regionEnd,
      contentName: scope
    })),
    ...tokenSymbolPatterns.map(([scope, literal]) => ({
      name: scope,
      match: `(?<!\\S)${escapeRegex(literal)}`
    }))
  ]
};

writeFileSync(destinationPath, `${JSON.stringify(grammar, null, 2)}\n`, "utf8");
console.log(`Wrote ${destinationPath}`);
