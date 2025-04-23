// Approach 1 (Mongoose Query) | Two database trips - one for counting documents and other for data |
/*
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = { ...this.queryString };
    const excludedFields = ['sort', 'limit', 'page', 'fields', 'keyword'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // { price: { lt: 1500 } }  =>  { price: { $lt: 1500 } }
    queryObj = JSON.parse(
      JSON.stringify(queryObj).replace(/\b(lt|lte|gt|gte)\b/g, (match) => `$${match}`),
    );

    this.query = this.query.find(queryObj);
    return this;
  }

  search() {
    if (this.queryString.keyword) {
      const queryObj = {};
      const modelName = this.query.model.modelName;
      if (modelName === 'Product') {
        queryObj.$or = [
          { name: { $regex: this.queryString.keyword, $options: 'i' } },
          { description: { $regex: this.queryString.keyword, $options: 'i' } },
        ];
      } else {
        queryObj.name = { $regex: this.queryString.keyword, $options: 'i' };
      }
      this.query = this.query.find(queryObj);
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortFields = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortFields);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  async count() {
    this.count = await this.query.clone().countDocuments();
    return this;
  }

  paginate(documentsCount) {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 10;
    const skip = (page - 1) * limit;
    const endIndex = page * limit; // 1 * 10 = 10

    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numOfPages = Math.ceil(documentsCount / limit);

    if (endIndex < documentsCount) pagination.next = page + 1;
    if (skip) pagination.prev = page - 1;

    this.paginationResult = pagination;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
*/

import { Aggregate } from 'mongoose';

// Approach 2 (Aggregation) | One database trip by using $facet stage in aggregation pipeline |
class APIFeatures {
  constructor(
    public aggregation: Aggregate<any>,
    public queryString: any,
  ) {}

  filter() {
    let queryObj = { ...this.queryString };
    const excludedFields = ['sort', 'limit', 'page', 'fields', 'keyword'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // { price: { lt: 1500 } }  =>  { price: { $lt: 1500 } }
    queryObj = JSON.parse(
      JSON.stringify(queryObj).replace(/\b(lt|lte|gt|gte)\b/g, (match) => `$${match}`),
    );

    // multiple price filtering: {price: [50, 100]} => {price: {$in: [50, 100]}} - Don't have to do this in the first approach
    if (Array.isArray(queryObj.price)) queryObj.price = { $in: queryObj.price };

    // Function to parse string numbers to numbers - Don't have to do this in the first approach
    const parseValue = (value: any) => {
      if (typeof value === 'object') {
        Object.keys(value).forEach((key) => (value[key] = parseValue(value[key])));
      } else if (!isNaN(value) && value !== '') {
        return Number(value);
      }
      return value;
    };

    if (Object.keys(queryObj).length > 0) {
      queryObj = parseValue(queryObj);
      // this.aggregation.append({ $match: queryObj });
      this.aggregation.match(queryObj);
    }
    return this;
  }

  search() {
    if (this.queryString.keyword) {
      const queryObj: Record<string, object> = {};
      const { modelName } = (this.aggregation as any)._model; // _model exists in the runtime
      if (modelName === 'Product') {
        queryObj.$or = [
          { name: { $regex: this.queryString.keyword, $options: 'i' } },
          { description: { $regex: this.queryString.keyword, $options: 'i' } },
        ];
      } else {
        queryObj.name = { $regex: this.queryString.keyword, $options: 'i' };
      }

      this.aggregation.match(queryObj);
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortFields = this.queryString.sort.split(',').join(' ');
      this.aggregation.sort(sortFields);
    } else {
      this.aggregation.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.aggregation.project(fields);
    } else {
      this.aggregation.project('-__v' as any);
    }
    return this;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 50;
    const skip = (page - 1) * limit;

    this.aggregation.facet({
      data: [{ $skip: skip }, { $limit: limit }],
      count: [
        { $count: 'documentsCount' },
        { $addFields: { numOfPages: { $ceil: { $divide: ['$documentsCount', limit] } } } },
      ],
    });

    return this;
  }
}

export default APIFeatures;
