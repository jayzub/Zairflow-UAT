// require('dotenv').config();

// const request = require('supertest');
// const mongoose = require('mongoose');
// const app = require('../app');
// const Product = require('../models/product');
// const Category = require('../models/category');

// describe('Product Controller Tests', () => {
//     beforeAll(async () => {
//         await mongoose.connect(process.env.DB_URL, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//     });

//     afterEach(async () => {
//         await Product.deleteMany();
//         await Category.deleteMany();
//     });

//     afterAll(async () => {
//         await mongoose.connection.close();
//     });

//     describe('GET /api/v1/products', () => {
//         it('should return paginated products', async () => {
//             await Product.create([
//                 { name: 'Product 1', description: 'Desc 1', price: 10, countInStock: 5 },
//                 { name: 'Product 2', description: 'Desc 2', price: 15, countInStock: 3 },
//             ]);
//             const res = await request(app).get('/api/v1/products?page=1&limit=2');
//             expect(res.statusCode).toBe(200);
//             expect(res.body).toHaveProperty('products');
//             expect(res.body.products.length).toBeLessThanOrEqual(2);
//         });
//     });

//     describe('POST /api/v1/products', () => {
//         it('should create a product', async () => {
//             const category = await Category.create({ name: 'Electronics' });
//             const res = await request(app)
//                 .post('/api/v1/products')
//                 .send({
//                     name: 'Test Product',
//                     description: 'A test product',
//                     category: category._id,
//                     price: 100,
//                     countInStock: 10,
//                 });
//             expect(res.statusCode).toBe(201);
//             expect(res.body).toHaveProperty('data');
//             expect(res.body.data).toHaveProperty('name', 'Test Product');
//         });
//     });

//     describe('GET /api/v1/products/:id', () => {
//         it('should return a product by ID', async () => {
//             const product = await Product.create({
//                 name: 'Product 1',
//                 description: 'Description 1',
//                 price: 50,
//                 countInStock: 5,
//             });
//             const res = await request(app).get(`/api/v1/products/${product._id}`);
//             expect(res.statusCode).toBe(200);
//             expect(res.body.data).toHaveProperty('_id', product._id.toString());
//         });
//     });

//     describe('PUT /api/v1/products/:id', () => {
//         it('should update a product', async () => {
//             const product = await Product.create({
//                 name: 'Product 2',
//                 description: 'Description 2',
//                 price: 60,
//                 countInStock: 5,
//             });
//             const res = await request(app)
//                 .put(`/api/v1/products/${product._id}`)
//                 .send({ price: 80 });
//             expect(res.statusCode).toBe(200);
//             expect(res.body.data).toHaveProperty('price', 80);
//         });
//     });

//     describe('DELETE /api/v1/products/:id', () => {
//         it('should delete a product', async () => {
//             const product = await Product.create({
//                 name: 'Product 3',
//                 description: 'Description 3',
//                 price: 70,
//                 countInStock: 5,
//             });
//             const res = await request(app).delete(`/api/v1/products/${product._id}`);
//             expect(res.statusCode).toBe(200);
//             expect(res.body.message).toBe('Product deleted successfully');
//         });
//     });

//     describe('GET /api/v1/products/count', () => {
//         it('should return the total count of products', async () => {
//             await Product.create([
//                 { name: 'Product 4', description: 'Desc 4', price: 20, countInStock: 5 },
//                 { name: 'Product 5', description: 'Desc 5', price: 25, countInStock: 8 },
//             ]);
//             const res = await request(app).get('/api/v1/products/count');
//             expect(res.statusCode).toBe(200);
//             expect(res.body.data).toHaveProperty('count');
//             expect(res.body.data.count).toBe(2);
//         });
//     });
// });

//Next

// require('dotenv').config();
// const request = require('supertest');
// const app = require('../app'); // Your Express app instance
// const Product = require('../models/product');
// const Category = require('../models/category');

// const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server');

// let mongoServer;

// beforeAll(async () => {
//     mongoServer = await MongoMemoryServer.create();
//     const uri = mongoServer.getUri();

//     // Ensure no active connections before connecting
//     if (mongoose.connection.readyState !== 0) {
//         await mongoose.disconnect();
//     }

//     await mongoose.connect(uri, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     });
// });

// afterEach(async () => {
//     // Clear all collections after each test
//     const collections = mongoose.connection.collections;
//     for (const key in collections) {
//         await collections[key].deleteMany({});
//     }
// });

// afterAll(async () => {
//     // Disconnect and stop the in-memory server after all tests
//     await mongoose.disconnect();
//     await mongoServer.stop();
// });



// const mockCategory = {
//     name: 'Electronics',
//     icon: 'icon.png',
//     color: '#000000',
// };

// const mockProduct = {
//     name: 'Test Product',
//     description: 'Test Description',
//     price: 100,
//     category: [],
//     countInStock: 10,
// };

// describe('Product Controller', () => {
//     let categoryId;

//     beforeAll(async () => {
//         // Create a test category
//         const category = new Category(mockCategory);
//         const savedCategory = await category.save();
//         categoryId = savedCategory._id;
//         mockProduct.category.push(categoryId);
//     });

//     describe('GET /products', () => {
//         it('should return all products', async () => {
//             const product = new Product(mockProduct);
//             await product.save();

//             const res = await request(app).get('/api/v1/products');
//             expect(res.status).toBe(200);
//             expect(res.body.success).toBe(true);
//             expect(res.body.data.length).toBe(1);
//             expect(res.body.data[0].name).toBe(mockProduct.name);
//         });
//     });

//     describe('POST /products', () => {
//         it('should create a new product', async () => {
//             const res = await request(app)
//                 .post('/api/v1/products')
//                 .field('name', mockProduct.name)
//                 .field('description', mockProduct.description)
//                 .field('price', mockProduct.price)
//                 .field('category', JSON.stringify([categoryId]))
//                 .field('countInStock', mockProduct.countInStock)
//                 .attach('image', '__tests__/sample.jpg'); // Add a valid image file

//             expect(res.status).toBe(201);
//             expect(res.body.success).toBe(true);
//             expect(res.body.data.name).toBe(mockProduct.name);
//         });

//         it('should return 400 if no image is provided', async () => {
//             const res = await request(app)
//                 .post('/api/v1/products')
//                 .send(mockProduct);

//             expect(res.status).toBe(400);
//             expect(res.body.success).toBe(false);
//             expect(res.body.message).toBe('No image provided');
//         });
//     });

//     describe('GET /products/:id', () => {
//         it('should return a single product by ID', async () => {
//             const product = new Product(mockProduct);
//             const savedProduct = await product.save();

//             const res = await request(app).get(`/api/v1/products/${savedProduct._id}`);
//             expect(res.status).toBe(200);
//             expect(res.body.success).toBe(true);
//             expect(res.body.data.name).toBe(mockProduct.name);
//         });

//         it('should return 404 if product is not found', async () => {
//             const invalidId = new mongoose.Types.ObjectId();
//             const res = await request(app).get(`/api/v1/products/${invalidId}`);
//             expect(res.status).toBe(404);
//             expect(res.body.success).toBe(false);
//             expect(res.body.message).toBe('Product not found');
//         });
//     });

//     describe('PUT /products/:id', () => {
//         it('should update an existing product', async () => {
//             const product = new Product(mockProduct);
//             const savedProduct = await product.save();

//             const updatedData = { name: 'Updated Product' };
//             const res = await request(app)
//                 .put(`/api/v1/products/${savedProduct._id}`)
//                 .send(updatedData);

//             expect(res.status).toBe(200);
//             expect(res.body.success).toBe(true);
//             expect(res.body.data.name).toBe(updatedData.name);
//         });

//         it('should return 404 if the product does not exist', async () => {
//             const invalidId = new mongoose.Types.ObjectId();
//             const res = await request(app)
//                 .put(`/api/v1/products/${invalidId}`)
//                 .send({ name: 'Updated Product' });

//             expect(res.status).toBe(404);
//             expect(res.body.success).toBe(false);
//         });
//     });

//     describe('DELETE /products/:id', () => {
//         it('should delete an existing product', async () => {
//             const product = new Product(mockProduct);
//             const savedProduct = await product.save();

//             const res = await request(app).delete(`/api/v1/products/${savedProduct._id}`);
//             expect(res.status).toBe(200);
//             expect(res.body.success).toBe(true);

//             // Ensure the product is deleted from the database
//             const deletedProduct = await Product.findById(savedProduct._id);
//             expect(deletedProduct).toBeNull();
//         });

//         it('should return 404 if the product does not exist', async () => {
//             const invalidId = new mongoose.Types.ObjectId();
//             const res = await request(app).delete(`/api/v1/products/${invalidId}`);
//             expect(res.status).toBe(404);
//         });
//     });
// });


const mongoose = require('mongoose');
const NodeCache = require('node-cache');
const { getAllProducts } = require('../controllers/productController');
const Product = require('../models/product');
const Category = require('../models/category');

// Mock dependencies
jest.mock('../models/product');
jest.mock('../models/category');
jest.mock('node-cache');

describe('getAllProducts', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      accepts: jest.fn(),
    };
    res = {
      render: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return cached result if available', async () => {
    const cachedResult = { products: [{ name: 'Cached Product' }] };
    NodeCache.prototype.get.mockReturnValue(cachedResult);

    await getAllProducts(req, res, next);

    expect(res.render).toHaveBeenCalledWith('admin/products', cachedResult);
  });

  test('should fetch products from database if not cached', async () => {
    NodeCache.prototype.get.mockReturnValue(null);
    const mockProducts = [{ name: 'Product 1' }, { name: 'Product 2' }];
    Product.aggregate.mockResolvedValue(mockProducts);
    Product.countDocuments.mockResolvedValue(2);
    Category.find.mockResolvedValue([]);

    await getAllProducts(req, res, next);

    expect(Product.aggregate).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('admin/products', expect.objectContaining({
      products: mockProducts,
    }));
  });

  test('should apply filters correctly', async () => {
    req.query = {
      categories: 'cat1,cat2',
      minPrice: '10',
      maxPrice: '100',
    };
    NodeCache.prototype.get.mockReturnValue(null);
    Product.aggregate.mockResolvedValue([]);
    Product.countDocuments.mockResolvedValue(0);
    Category.find.mockResolvedValue([]);

    await getAllProducts(req, res, next);

    expect(Product.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
      { $match: expect.objectContaining({
        category: { $in: ['cat1', 'cat2'] },
        price: { $gte: 10, $lte: 100 },
      }) },
    ]));
  });

  test('should handle cursor-based pagination', async () => {
    req.query = { cursor: '123456789012' };
    NodeCache.prototype.get.mockReturnValue(null);
    Product.aggregate.mockResolvedValue([]);
    Product.countDocuments.mockResolvedValue(0);
    Category.find.mockResolvedValue([]);

    await getAllProducts(req, res, next);

    expect(Product.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
      { $match: expect.objectContaining({
        _id: { $gt: '123456789012' },
      }) },
    ]));
  });

  test('should handle errors', async () => {
    NodeCache.prototype.get.mockReturnValue(null);
    Product.aggregate.mockRejectedValue(new Error('Database error'));

    await getAllProducts(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
