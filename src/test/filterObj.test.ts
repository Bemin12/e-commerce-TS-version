/* eslint-disable */
import filterObj from '../utils/filterObj.js';

describe('filterObj', () => {
  it('should return object with only allowed fields', () => {
    const testObj = { name: 'Bemin Raafat', age: 22, role: 'admin', verfied: 'true' };

    const filteredObj = filterObj(testObj, 'name', 'age');

    expect(filteredObj).toEqual({ name: 'Bemin Raafat', age: 22 });
  });
});
