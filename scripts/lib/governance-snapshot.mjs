import { generatedAt, sha } from "./utils.mjs";

function tokenKey(token) {
  return `${token.name}|${token.file}|${token.selector}`;
}

function directKey(item) {
  return `${item.category}|${item.property ?? ""}|${item.value}`;
}

function index(items, key) {
  return new Map(items.map((item) => [key(item), item]));
}

export function createGovernanceSnapshot(library) {
  const tokens = library.tokens.map((token) => ({
    key: tokenKey(token),
    id: token.id,
    name: token.name,
    value: token.value,
    resolvedValue: token.resolvedValue,
    category: token.category,
    group: token.group,
    scope: token.scope,
    file: token.file,
    line: token.line,
    usage: token.usage,
  }));
  const directStyles = library.directStyles.map((item) => ({
    key: directKey(item),
    id: item.id,
    category: item.category,
    property: item.property,
    value: item.value,
    occurrences: item.occurrences,
    files: item.files,
    usage: item.usage,
  }));
  return {
    schemaVersion: 1,
    snapshotId: sha(JSON.stringify({ project: library.project, tokens, directStyles }), 24),
    generatedAt: generatedAt(),
    project: library.project,
    summary: library.summary,
    tokens,
    directStyles,
  };
}

export function compareGovernanceSnapshots(before, after) {
  const beforeTokens = index(before.tokens ?? [], (item) => item.key);
  const afterTokens = index(after.tokens ?? [], (item) => item.key);
  const beforeDirect = index(before.directStyles ?? [], (item) => item.key);
  const afterDirect = index(after.directStyles ?? [], (item) => item.key);
  const removedTokens = [...beforeTokens.entries()].filter(([key]) => !afterTokens.has(key)).map(([, item]) => item);
  const addedTokens = [...afterTokens.entries()].filter(([key]) => !beforeTokens.has(key)).map(([, item]) => item);
  const changedTokens = [...beforeTokens.entries()].filter(([key, item]) => afterTokens.has(key) && (afterTokens.get(key).value !== item.value || afterTokens.get(key).resolvedValue !== item.resolvedValue)).map(([key, item]) => ({ before: item, after: afterTokens.get(key) }));
  const removedDirectStyles = [...beforeDirect.entries()].filter(([key]) => !afterDirect.has(key)).map(([, item]) => item);
  const addedDirectStyles = [...afterDirect.entries()].filter(([key]) => !beforeDirect.has(key)).map(([, item]) => item);
  const remainingDirectStyles = [...afterDirect.entries()].filter(([key]) => beforeDirect.has(key)).map(([, item]) => item);
  return {
    schemaVersion: 1,
    generatedAt: generatedAt(),
    beforeSnapshotId: before.snapshotId,
    afterSnapshotId: after.snapshotId,
    summary: {
      tokensBefore: before.tokens?.length ?? 0,
      tokensAfter: after.tokens?.length ?? 0,
      tokensRemoved: removedTokens.length,
      tokensAdded: addedTokens.length,
      tokensChanged: changedTokens.length,
      directStylesBefore: before.directStyles?.length ?? 0,
      directStylesAfter: after.directStyles?.length ?? 0,
      directStylesRemoved: removedDirectStyles.length,
      directStylesRemaining: remainingDirectStyles.length,
      directStylesAdded: addedDirectStyles.length,
    },
    removedTokens,
    addedTokens,
    changedTokens,
    removedDirectStyles,
    remainingDirectStyles,
    addedDirectStyles,
  };
}
