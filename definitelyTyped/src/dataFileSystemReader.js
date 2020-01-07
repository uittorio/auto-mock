function dataFileSystemReader(dataPath, fileReader) {
    if (!dataPath) {
        throw new Error('dataPath must be specified to use dataFileSystemReader');
    }

    const listPath = `${dataPath}/list.json`;

    return {
        async getDataIds() {
            try {
                const fileList = await fileReader.readFile(listPath);
                return JSON.parse(fileList);
            } catch {
                return [];
            }
        },
        async getAllData() {
            const dataIds = await this.getDataIds();
            const allData = [];

            for(let i = 0; i < dataIds.length; i++) {
                allData.push(await this.getData(dataIds[i]));
            }

            return allData;
        },
        async getData(id) {
            const toParse = await fileReader.readFile(`${dataPath}/${id}`);
            const data = JSON.parse(toParse);

            return { id: id, data: data };
        }
    }
}

module.exports = dataFileSystemReader;
