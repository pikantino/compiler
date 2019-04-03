# @pikantino/compiler

It's a tool to compile Typescript/Angular project into "ready-for-use" ES6 Modules. Uses [@pikantino/pkg](https://github.com/pikantino/pkg) to compile dependencies.
**1 second or less incremental builds irrespective of project complexity.**

## Installing

[@pikantino/pkg](https://github.com/pikantino/pkg) is a peer dependency and should be installed manually.

``` 
  npm i @pikantino/pkg @pikantino/compiler --save-dev 
```

## Usage

0. (Optional) Create an additional index.html file to retain the possibility of ng builds.

1. Add all of the polyfills to index.html as CDN links:
```
  <script src="https://cdnjs.cloudflare.com/ajax/libs/core-js/2.6.5/core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/zone.js/0.8.29/zone.min.js"></script>
```

3. Add entry point with type="module" and ".js" extension at the end of the body of index.html with a path relative to the root of the app:
```
  <script src="src/main.js" type="module">
```

4. Run pikantino-compiler (and pass the name of new index.html if it was created or run without any arguments) 
```
  pikantino-compiler -i index.html
```

5. Serve ./dist folder in any way ([http-server](https://github.com/indexzero/http-server) might help).

You might also want to run ``` tsc -w --noEmit ``` to get types checked.

## CLI

```
$ pikantino-compiler --help
Options:
  --version      Show version number                                   [boolean]
  --outDir, -o   Output directory                              [default: "dist"]
  --srcDir, -s   Sources directory                              [default: "src"]
  --modules, -m  Modules output directory               [default: "web_modules"]
  --tsconfig     TsConfig file path                   [default: "tsconfig.json"]
  --index        Index.html file path relative to your src folder
                                                         [default: "index.html"]
  --watch, -w    Watch changes and rebuild
  --help         Show help                                             [boolean]
```

## Roadmap

- [ ] Add lazy loading (SystemJS) setup guide
- [ ] Add ability to pack dependencies that don't have ES6 build
- [ ] Integrate serving tool and live reload
- [ ] Integrate live type checking
