/* eslint-disable */
import sanitizeXss from '../middlewares/xssMiddleware.js';
import xss from 'xss';

describe('xssMiddleware', () => {
  let req: any;
  let res: any;
  let next: any;
  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {};
    next = jest.fn();
  });

  it('should sanitize strings', () => {
    req.body = { name: '<script>alert(123);</script>' };

    sanitizeXss()(req, res, next);

    expect(req.body.name).toBe(xss(req.body.name));
    expect(next).toHaveBeenCalled();
  });

  it('should sanitize arrays', () => {
    const color1 = '<script>fetch("/api/v1/me")</script>';
    const color2 = '<body onload="myFunction()">';
    const color3 = 'red';
    req.body = { colors: [color1, color2, color3] };

    sanitizeXss()(req, res, next);

    expect(req.body.colors).toEqual([xss(color1), xss(color2), color3]);
    expect(next).toHaveBeenCalled();
  });

  it('should sanitize objects', () => {
    const address = {
      alias: '<svg/onload=alert(1)>',
      details: '<img src=x onerror=alert(1)>',
      city: 'cairo',
    };

    req.body = { address };

    sanitizeXss()(req, res, next);

    expect(req.body.address).toEqual({
      alias: xss(address.alias),
      details: xss(address.details),
      city: address.city,
    });
    expect(next).toHaveBeenCalled();
  });

  it('should sanitize nested objects', () => {
    const obj = {
      name: '"><img src=x onerror=alert(1)>',
      email: '"><script>alert(1)</script>',
      age: 20,
    };

    req.body = { obj };

    sanitizeXss()(req, res, next);

    expect(req.body).toEqual({ obj: { name: xss(obj.name), email: xss(obj.email), age: obj.age } });
    expect(next).toHaveBeenCalled();
  });

  it('should sanitize deeply nested objects and arrays', () => {
    const obj = {
      nested: {
        obj: { deep: '<iframe src=javascript:alert(1)></iframe>' },
        arr: ['<svg/onload=alert(1)>', `"';alert(1);'`],
      },
    };

    req.body = { obj };

    sanitizeXss()(req, res, next);

    expect(req.body.obj.nested.obj.deep).toBe(xss(req.body.obj.nested.obj.deep));
    expect(req.body.obj.nested.arr[0]).toBe(xss(req.body.obj.nested.arr[0]));
    expect(req.body.obj.nested.arr[1]).toBe(xss(req.body.obj.nested.arr[1]));
    expect(next).toHaveBeenCalled();
  });

  it('should handle nulls and undefined', () => {
    req.body = { name: null, description: undefined };

    sanitizeXss()(req, res, next);

    expect(req.body.name).toBeNull();
    expect(req.body.description).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
