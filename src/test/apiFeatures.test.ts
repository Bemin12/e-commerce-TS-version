/* eslint-disable */
import APIFeatures from '../utils/apiFeatures.js';

describe('APIFeatures', () => {
  let aggregation: any;
  let queryString: any;

  beforeEach(() => {
    aggregation = {
      match: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      project: jest.fn().mockReturnThis(),
      facet: jest.fn().mockReturnThis(),
      _model: { modelName: 'Product' },
    };

    queryString = {};
  });

  describe('filter method', () => {
    queryString = {
      sort: 'price,-sold',
      limit: 10,
      page: 2,
      fields: 'name,price,ratingsAverage',
      keyword: 'men',
    };

    it('should not call match if queryObj is empty after filtering', () => {
      const features = new APIFeatures(aggregation, queryString);

      const result = features.filter();

      expect(aggregation.match).not.toHaveBeenCalled();
      expect(result).toBe(features);
    });

    it('should filter out excluded fields and convert string numbers to actual numbers', () => {
      queryString = {
        ...queryString,
        price: '100',
        quantity: '50',
        color: 'red',
      };
      const features = new APIFeatures(aggregation, queryString).filter();

      const result = features.filter();

      expect(aggregation.match).toHaveBeenCalledWith({
        price: 100,
        quantity: 50,
        color: 'red',
      });
      expect(result).toBe(features);
    });

    it('handle nested objects with operators', () => {
      queryString = {
        ...queryString,
        price: { gt: '1000', lt: '5000' },
        ratingsAverage: { gte: '3' },
        color: 'red',
      };
      const features = new APIFeatures(aggregation, queryString).filter();

      const result = features.filter();

      expect(aggregation.match).toHaveBeenCalledWith({
        price: { $gt: 1000, $lt: 5000 },
        ratingsAverage: { $gte: 3 },
        color: 'red',
      });
      expect(result).toBe(features);
    });
  });

  describe('search method', () => {
    it('should not call match when there is no keyword in the queryString', () => {
      queryString = {};
      const features = new APIFeatures(aggregation, queryString);

      const result = features.search();

      expect(aggregation.match).not.toHaveBeenCalled();
      expect(result).toBe(features);
    });

    it('should set queryObj to the $or conditions for Product model', () => {
      queryString = { keyword: 'test' };
      const features = new APIFeatures(aggregation, queryString);

      const result = features.search();

      expect(aggregation.match).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'test', $options: 'i' } },
          { description: { $regex: 'test', $options: 'i' } },
        ],
      });
      expect(result).toBe(features);
    });

    it('should set queryObj to only name when model is not Product', () => {
      aggregation._model = 'Category';
      queryString = { keyword: 'test' };
      const features = new APIFeatures(aggregation, queryString);

      const result = features.search();

      expect(aggregation.match).toHaveBeenCalledWith({
        name: { $regex: 'test', $options: 'i' },
      });
      expect(result).toBe(features);
    });
  });

  describe('sort method', () => {
    it('should separate sort fields and call sort with them', () => {
      queryString = { sort: 'price,-sold' };
      const features = new APIFeatures(aggregation, queryString);

      const result = features.sort();

      expect(aggregation.sort).toHaveBeenCalledWith('price -sold');
      expect(result).toBe(features);
    });

    it('should call sort with -createdAt when no sort is not provided in queryString', () => {
      queryString = {};
      const features = new APIFeatures(aggregation, queryString);

      const result = features.sort();

      expect(aggregation.sort).toHaveBeenCalledWith('-createdAt');
      expect(result).toBe(features);
    });
  });

  describe('limitFields method', () => {
    it('should separate fields and call project with them', () => {
      queryString = { fields: 'name,price,ratingsAverage' };
      const features = new APIFeatures(aggregation, queryString);

      const result = features.limitFields();

      expect(aggregation.project).toHaveBeenCalledWith('name price ratingsAverage');
      expect(result).toBe(features);
    });

    it('should exclude __v if fields are not provided', () => {
      queryString = {};
      const features = new APIFeatures(aggregation, queryString);

      const result = features.limitFields();

      expect(aggregation.project).toHaveBeenCalledWith('-__v');
      expect(result).toBe(features);
    });
  });

  describe('paginate method', () => {
    it('should add facet with default pagination values', () => {
      queryString = {};
      const features = new APIFeatures(aggregation, queryString);

      const result = features.paginate();

      expect(aggregation.facet).toHaveBeenCalledWith({
        data: [{ $skip: 0 }, { $limit: 50 }],
        count: [
          { $count: 'documentsCount' },
          { $addFields: { numOfPages: { $ceil: { $divide: ['$documentsCount', 50] } } } },
        ],
      });
      expect(result).toBe(features);
    });

    it('should add facet with custom pagination values', () => {
      queryString = { limit: 10, page: 2 };
      const features = new APIFeatures(aggregation, queryString);

      const result = features.paginate();

      expect(aggregation.facet).toHaveBeenCalledWith({
        data: [{ $skip: 10 }, { $limit: 10 }],
        count: [
          { $count: 'documentsCount' },
          { $addFields: { numOfPages: { $ceil: { $divide: ['$documentsCount', 10] } } } },
        ],
      });
      expect(result).toBe(features);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const features = new APIFeatures(aggregation, queryString);
      const result = features.filter().search().sort().limitFields().paginate();

      expect(result).toBe(features);
    });
  });
});
