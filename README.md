# Libraries.io parser

```
https://libraries.io/api/npm/mocha?api_key=55830a25cdfb7da183e04d2757e89ebb
https://libraries.io/npm/mocha
```

## Search worker

Compact debug:
```
DEBUG=app:request npm start
DEBUG=app:worker npm start
DEBUG=app:db npm start
```

Full debug:
```
DEBUG=app:request,app:worker,app:db npm start
DEBUG=app:* npm start
```

