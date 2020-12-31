# Local File Storage
This library stores all your data locally in a file. Create, Read and Delete (CRD) operations can be performed with the data stored. Each record has a TimeToLive property which signifies it's' time to live, post which it is no longer available for operations.

## Installation
`npm i local-file-storage`

## Examples
`const LocalFileStorage = require('local-file-storage');` <br/>
`const file = LocalFileStorage();` <br/>
 `const file = LocalFileStorage(['filename']);`
 
 If no file name is provided, the data would be stored in "FileStorage.txt".
 
### Create
`file.create(key, value, [timeToLive]);` 

It expects key in the form of string, value in the form of JSON and time to live in the form of integer <br/>
If the key is already present, it will throw an error.

### Read
`file.get(key);`

returns JSON value associated with the key

### Delete
`file.delete(key);` 