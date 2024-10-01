const {
    writeFragment,
    readFragment,
    writeFragmentData,
    readFragmentData,
    listFragments,
    deleteFragment
} = require('../../src/model/data/memory/index');

describe('Test fragment database functions', () => {
    const ownerId = "user01"
    const id = "fragment01"
    const content = "A test fragment.";
    const buffer = Buffer.from(content);

    const fragment = {
        ownerId,
        id,
        content
    };

    // Clean up the fragment's metadata and data before each data
    beforeEach(async () => {
        try {
            await deleteFragment(ownerId, id);
        } catch (error) {
            if (error.message !== `missing entry for primaryKey=${ownerId} and secondaryKey=${id}`) {
                throw error;
            }
        }
    });    

    test('writeFragment() writes fragment and readFragment() reads fragment', async () => {
        await writeFragment(fragment);
        const result = await readFragment(ownerId, id);
        expect(result).toEqual(fragment);
    });

    test('readFragment() returns undefined if fragment\'s meta is not exist', async () => {
        const result = await readFragment(ownerId, id);
        expect(result).toBeUndefined();
    });

    test('writeFragmentData() writes fragment\'s data buffer and readFragmentData() reads fragment\' data', async() => {
        await writeFragmentData(ownerId, id, buffer);
        const result = await readFragmentData(ownerId, id);
        expect(result).toEqual(buffer);
    });

    test('readFragmentData() returns undefined if fragment\'s data is not exist', async () => {
        const result = await readFragmentData(ownerId, id);
        expect(result).toBeUndefined();
    });

    test('listFragments() lists the ids', async () => {
        await writeFragment(fragment);
        const ids = await listFragments(ownerId);
        expect(ids).toEqual([fragment.id]);
    });
    
    test('listFragments() returns expanded fragments', async () => {
        await writeFragment(fragment);
        // Should return a list of fragment instead of ids
        const extendedFragments = await listFragments(ownerId, true);
        expect(extendedFragments).toEqual([fragment]); 
    });

    test('deleteFragment() deletes a fragment\'s metadata and data', async () => {
        await writeFragment(fragment);
        await writeFragmentData(ownerId, id, buffer);
        
        await deleteFragment(ownerId, id);

        const metadata = await readFragment(ownerId, id);
        expect(metadata).toBeUndefined();

        const data = await readFragmentData(ownerId, id);
        expect(data).toBeUndefined();
    });

    test('deleteFragment() handles non-existing fragment with correct err message', async () => {
        await expect(deleteFragment(ownerId, id)).rejects.toThrow(`missing entry for primaryKey=${ownerId} and secondaryKey=${id}`);
    });
});