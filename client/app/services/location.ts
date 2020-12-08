import { isNil, isUndefined, isFunction, isObject, trimStart, mapValues, omitBy, extend } from "lodash";
import qs from "query-string";
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'hist... Remove this comment to see the full error message
import { createBrowserHistory } from "history";

const history = createBrowserHistory();

function normalizeLocation(rawLocation: any) {
  const { pathname, search, hash } = rawLocation;
  const result = {};

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'path' does not exist on type '{}'.
  result.path = pathname;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'search' does not exist on type '{}'.
  result.search = mapValues(qs.parse(search), value => (isNil(value) ? true : value));
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'hash' does not exist on type '{}'.
  result.hash = trimStart(hash, "#");
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'url' does not exist on type '{}'.
  result.url = `${pathname}${search}${hash}`;

  return result;
}

const location = {
  listen(handler: any) {
    if (isFunction(handler)) {
      return history.listen((unused: any, action: any) => handler(location, action));
    } else {
      return () => {};
    }
  },

  confirmChange(handler: any) {
    if (isFunction(handler)) {
      return history.block((nextLocation: any) => {
        return handler(normalizeLocation(nextLocation), location);
      });
    } else {
      return () => {};
    }
  },

  update(newLocation: any, replace = false) {
    if (isObject(newLocation)) {
      // remap fields and remove undefined ones
      newLocation = omitBy(
        {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'path' does not exist on type 'object'.
          pathname: newLocation.path,
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'search' does not exist on type 'object'.
          search: newLocation.search,
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'hash' does not exist on type 'object'.
          hash: newLocation.hash,
        },
        isUndefined
      );

      // keep existing fields (!)
      newLocation = extend(
        {
          pathname: location.path,
          search: location.search,
          hash: location.hash,
        },
        newLocation
      );

      // serialize search and keep existing search parameters (!)
      if (isObject(newLocation.search)) {
        newLocation.search = omitBy(extend({}, location.search, newLocation.search), isNil);
        newLocation.search = mapValues(newLocation.search, value => (value === true ? null : value));
        newLocation.search = qs.stringify(newLocation.search);
      }
    }
    if (replace) {
      history.replace(newLocation);
    } else {
      history.push(newLocation);
    }
  },

  url: undefined,

  path: undefined,
  setPath(path: any, replace = false) {
    location.update({ path }, replace);
  },

  search: undefined,
  setSearch(search: any, replace = false) {
    location.update({ search }, replace);
  },

  hash: undefined,
  setHash(hash: any, replace = false) {
    location.update({ hash }, replace);
  },
};

function locationChanged() {
  extend(location, normalizeLocation(history.location));
}

history.listen(locationChanged);
locationChanged(); // init service

export default location;