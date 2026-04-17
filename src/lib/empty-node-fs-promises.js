export async function readFile() {
  throw new Error("node:fs/promises is unavailable in browser bundles.");
}

const emptyNodeFsPromises = {
  readFile,
};

export default emptyNodeFsPromises;
