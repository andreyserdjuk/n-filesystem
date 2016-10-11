/**
 * Provides possibility to iterate directory path nested directories one-by-one.
 * Designed for usage in Filesystem recursive methods to avoid repeating
 * of nested directories traversing logic.
 * 
 * For example:
 *  - '/path/to/dir' -> ['/path', 'to', 'dir']
 *  - 'path/to/dir'  -> ['path', 'to', 'dir']
 */
export class DirectoryPath implements Iterable<string> {

    /**
     * @example '/abs/path/to/dir', 'rel/path/to/dir', '../../path/to/dir'
     */
    constructor(private path:string) {};

    [Symbol.iterator]()
    {
        let dirs = this.path.split('/');

        if (dirs[0] === '') {
            dirs.shift();
            dirs[0] = '/' + dirs[0];
        }

        let cursor = 0;

        return {
            next(): IteratorResult<string>
            {
                cursor++;
                return {
                    done: dirs.length > cursor,
                    value: dirs[cursor]
                };
            }
        };
    }
}