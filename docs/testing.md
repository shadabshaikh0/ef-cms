# Testing

This part of the documentation will explain the various types of automated tests we write in Dawson, and how to run them.

## Unit Testing

Unit testing is our first line of defense to verify our application meets the business requirements defined by the Court.  All of our code is unit tested using [Jest](https://facebook.github.io/jest/), and we strive to **keep code coverage >= 95% when possible**.

If you want to run the unit tests, you can do so with one of the following commands:

- `npm run test:client:unit`
- `npm run test:shared`
- `npm run test:api`

These run all unit tests in the `client`, `shared`, and `api` directories, respectively.

Often you just want to run a single test file.  You can do that using the following command:

`npx jest <PATH_TO_TEST_FILE>`

?> if the implementation is considered an **humble object** -- code that has no branching and very simple passthrough logic -- we often ignore it from testing.

### Overview of Jest

For every function and module, we write a unit test file with a matching *.test.js extension.  For example, if we have a `getClientId.js` file, we'll have a `getClientId.test.js` file in the same directory which verifies the public interface of that module or function.

Jest tests are setup by declaring `describe` and `it` blocks.  The `describe` block is a group of related tests.  The `it` block is a single test.  The `it` block can have multiple assertions.  For example, we might have a test that verifies that the `getClientId` function returns a string.  We might also have a test that verifies that the `getClientId` function returns a string with a length of 32 characters.  We can have multiple `it` blocks in a `describe` block.

For example:

```javascript
const { getClientId } = require('./getClientId');
describe('getClientId', () => {
    it('returns a string', () => {
        expect(getClientId()).toBeString();
    });

    it('the string should be 32 characters long', () => {
        expect(getClientId()).toHaveLength(32);
    });
});
```

Each `it` statement should be a small test with a single assertion (if possible).  The reason we keep tests small is so that we can verify when specific parts of a function are broken instead of having the entire test suite fail when something goes wrong.

### Mocking

Most of our code in Dawson is passed in an applicationContext which is where we have our third party dependencies setup via dependency inversion.  It's pretty easy to mock dependencies on the applicationContext because we can just define a new function using `jest.fn()` which will create a jest mock that we can use to verify that the function was called.  For example:

```javascript
const { getClientId } = require('./getClientId');
it('should invoke fetch', () => {
    const getMock = jest.fn();
    getClientId({
        applicationContext: {
            get: getMock,
        }
    })
    expect(getMock).toBeCalled();
})
```

Unfortunately, we often need to mock out dependencies that do not live on the applicationContext.  For example, if we pretend the `getClientId` method requires another function from a DateHandler module, we might need to mock it out using `jest.mock` function, like so:

```javascript
// mock out ONLY the 'createISODateString' function while allowing original implementations
const { createISODateString } = require('../utilities/DateHandler');
jest.mock('../utilities/DateHandler', () => {
  // import the original DateHandler module
  const originalModule = jest.requireActual('../utilities/DateHandler');
  return {
    __esModule: true,
    ...originalModule,
    createISODateString: jest.fn(), // mock out the createISODateString function
  };
});

describe('getClientId', () => {
  beforeAll(() => {
    createISODateString.mockReturnValue('2019-02-01T22:54:06.000Z');
  });

  it('should save iso date', async () => {
      // the function will now use the mock date when DateHandler is invoked
      getClientId();
  });
});
```

The example above is used specifically when we want to use a majority of the original implementation of the module, but maybe just mock out a few functions on the module.  

!> jest.mock is a bit confusing - a good rule of thumb is to write your implementation in such a way that won't require you to jest.mock a lot of things.


## Integration Testing

Since we know unit tests are not perfect and will miss potential bugs, we incorporate a lot of integration tests against Dawson to verify our code.  Our integration tests test at the presenter level (i.e. we test the Cerebral sequences which will hit our API, Dynamo, and Elasticsearch).  We try to avoid testing at the React level due to additional complexity, brittleness, and slowness.

You can run the all of the integration tests locally with the following command, but they will take **a long time**.

`npm run test:client:integration`

Often the best way to write and run integration tests is by using the following command which will run just the single integration test:

`npm run test:file <PATH_TO_FILE_HERE>`

!> when running an integration test, remember to use the `test:file` script and not `npx jest` or the tests will fail with strange errors.

!> Your API must be running in order to run the integration tests.

### How Integration Tests are Set Up

The integration tests are located in `web-client/integration-tests`.  We tried to take a declarative approach in writing these tests.  Each test file is made up of smaller helper test files that are found in `web-client/integration-tests/journey`, where each journey file is a small step in the larger integration test scenario.

For example, the `web-client/integration-tests/admissionsClerkPractitionerJourney.test.js` test invokes multiple journey functions like so to create a petition, serve the petition, and add a practitioner to the case:

```javascript
describe('admissions clerk practitioner journey', () => {
//... code above omitted for brevity
    loginAs(cerebralTest, 'petitionsclerk@example.com');
    petitionsClerkViewsCaseDetail(cerebralTest);
    petitionsClerkServesPetitionFromDocumentView(cerebralTest);
    petitionsClerkAddsPractitionersToCase(cerebralTest, true);
//... code below omitted for brevity
});
```

?> Try to keep the journey functions small and reusable by other tests in the future if needed. 


## Smoke Tests

Testing all our functionality locally is a good way to catch bugs, but often when we deploy all our code to AWS, stuff is misconfigured which causes things to break.  For this reason, we have a variety of smoketests written in Cypress to make sure a user can at least click through the UI and run a couple of key pieces of functionality.

The scripts we use for running smoketests include the following:

- `npm run cypress:smoketests`
- `npm run cypress:readonly:public`
- `npm run cypress:readonly:public`

### Cypress Information

Cypress is a great tool for writing and running end-to-end tests against web interfaces.  The Cypress CLI runner also provides a useful `open` command which will load a chromium instance locally which developers can use to watch the smoketests click through the UI and rewind history.  You can try running the smoketests against a deployed environment or locally using the following commands:

- `npm run cypress:integration:open`
- `npm run cypress:readonly:open`
- `npm run cypress:readonly:public:open`
- `npm run cypress:smoketests:open:local`



## Testing Matrix

At one point in this project, our team agreed to comprehensively manually test our system on a quarterly basis.  We have a [Testing Matrix Google Sheet](https://docs.google.com/spreadsheets/d/1FUHKC_YrT-PosaWD5gRVmsDzI1HS_U-8CyMIb-qX9EA) which outlines a variety of different scenarios and the expected outcomes.  I'd recommend trying to at least read through *some* of this test matrix since it will give you good insight into many of the business rules our system needs to abide by.

## Load Testing

!> We instead use Artillery to do load testing. Check out the `Performance Testing` section below for more information.

In the past, we found that large amounts of traffic to order and opinion search was causing our Elasticsearch cluster to become overwhelmed and unstable.  In order to verify that our application can handle the load of various requests, a load testing runner was setup using [Gatling](https://gatling.io/).  This load testing tool is written in Groovy which is why we keep it separate from our main repo.  

See [ustaxcourt/ef-cms-load-tests](https://github.com/ustaxcourt/ef-cms-load-tests) for Gatling load tests.

## Performance Testing

Similar to the load testing mentioned above, we run performance testing against Dawson using [Artillery](https://www.artillery.io/).  This tool is based on Javascript, is set up using .yml files, and is easier to read and understand than the Java based [gatling](https://gatling.io/) tool. 

To run the performance tests, you can run one of the following:

- `npm run test:performance` (runs the ./artillery/private-app.yml file)
- `npm run test:performance:order` (runs the ./artillery/private-advanced-order.yml file)



## Testing / Coverage Tips

You can put the following command into your .bashrc file to have code coverage display when running unit tests individually:

```bash
npx() {
    if [[ $@ == "jest"* ]]; then
        coverage_file=$(echo "$@" | sed -e "s/jest[[:space:]]*//" -e "s/.test//")
        command npx jest "$@" --coverage --collectCoverageFrom "$coverage_file"
    else
        command npx "$@"
    fi
}
```

This will print coverage whenever you run `npx jest <PATH_TO_TEST_FILE>`, which is really useful for development.

Example coverage output:
```
----------|----------|----------|----------|----------|-------------------|
File      |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
----------|----------|----------|----------|----------|-------------------|
All files |        0 |        0 |        0 |        0 |                   |
----------|----------|----------|----------|----------|-------------------|
```
- Stmts: % of statements executed in the code
- Branch: % of control structures (for example, `if` statements) executed in the code
- Funcs: % of functions executed in the code
- Uncovered Line #s: lines not covered by tests

## Pa11y Tests

We care about accessability on Dawson; therefore, we use [Pa11y](https://pa11y.org/) to run a variety of accessability checks against our site.  More specifically, we use [pa11y-ci](https://www.npmjs.com/package/pa11y-ci) which handles spinning up a local instance of Pa11y and running the checks against the site. 

If you have your UI and API running locally, you can use the following command to run the Pa11y tests:

- `npm run test:pa11y`
- `npm run test:pa11y:public`


### How Pa11y Works

Pa11y is set up using .json files that define which URL it should hit and what actions it should invoke.  For example, we have a file called `web-client/pa11y/pa11y-judge.js` which contains the following:

```javascript
[
  'http://localhost:1234/log-in?code=judgeColvin@example.com&path=/',
  {
    actions: [
      'wait for #advanced-search-button to be visible',
      'click element #advanced-search-button',
      'wait for .search-results to be visible',
    ],
    notes: 'checks a11y of advanced search results table',
    url: 'http://localhost:1234/log-in?code=judgeColvin@example.com&path=/search?petitionerName=cairo',
  }
  //.... more pa11y tests
]
```

The Pa11y test is made up of an array of either URLs or objects.  The url will have `?code=EMAIL` which will log in as that user and navigate to `&path=URL`.  We can also provide a list of `actions` which Pa11y will follow when the page loads.  We often use the `actions` list for clicking on buttons to have modals show and verify them again Pa11y.

### An issue with Pa11y in CI/CD

One thing you'll notice is that our application have many pa11y tests split up into smaller scripts

- `npm run test:pa11y:1`
- `npm run test:pa11y:2`
- `npm run test:pa11y:3`
- `npm run test:pa11y:4`

The main reason for this is that we've noticed that Pa11y seems to eat up memory in our CI/CD pipeline and cause the Docker containers to throw `out of memory` exceptions.  Currently, our best fix involves splitting up these test suites into smaller suites.

### Accessibility HTML_CodeSniffer Bookmarklet

The following bookmarklet is useful for running Pa11y directly on the page you are viewing.  The following link should have instruction on how to setup and use:

https://squizlabs.github.io/HTML_CodeSniffer/

## Testing Everything via Docker

!> developers don't develop with docker locally, so this might not work as expected

If needed, you can run all the tests locally by running the following:

```sh
./docker-test-all.sh
```

This will run the linter, Shellcheck, audit, build, test, Cypress, Cerebral tests, Pa11y, etc. over all the components.


## PDF Testing

Since our system generates a lot of PDFs, we have a set of tests that verify the pdfs didn't change using a checksum of the first exported image of the pdfs.  Since all of these PDFs share a single .scss file, there is risk involved when trying to update a single PDF to accidentally change the styles of other PDFs.  Therefore, we have a set of tests that verify that the PDFs are not changing.

All of the expected output images are found in the `./shared/test-pdf-expected-images` directory.  In order to update these, you will need to run the following command:


```
docker build -t "ef-cms-us-east-1:pdf-compare" -f Dockerfile-pdf-testing .
docker run -it -v `pwd`/shared/test-output:/home/app/efcms/shared/test-output ef-cms-us-east-1:pdf-compare sh -c "cd efcms && ./update-pdf-images.sh"
cp -r shared/test-output/*.1.png shared/test-pdf-expected-images/
```

## Client Integration Testing
If you want to be able to run `build-client-integration` tests within a Docker container locally for debuggging purposes without deploying, you could use these commands.

```
docker build -t "ef-cms-us-east-1:integration-tests" -f Dockerfile-integration .
docker run -it -v `pwd`/shared/test-output:/home/app/efcms/shared/test-output ef-cms-us-east-1:integration-tests sh -c "cd efcms && ./run-integration-tests.sh"
```