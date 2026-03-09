const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ferrari F1 Shop API',
      version: '1.0.0',
      description: 'API для интернет-магазина мерча Ferrari Formula 1'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Локальный сервер разработки'
      }
    ]
  },
  apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: integer
 *           description: Цена в рублях
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *         rating:
 *           type: number
 *           description: Рейтинг товара (0-5)
 *         image:
 *           type: string
 *           description: URL изображения
 */

let products = [
  {
    id: nanoid(6),
    name: 'Кепка Scuderia Ferrari F1',
    category: 'Аксессуары',
    description: 'Официальная кепка команды Scuderia Ferrari с вышитым логотипом. Цвет: красный',
    price: 4990,
    stock: 25,
    rating: 4.7,
    image: '../images/ferrari-cap.jpg'
  },
  {
    id: nanoid(6),
    name: 'Футболка Charles Leclerc #16',
    category: 'Одежда',
    description: 'Официальная футболка с номером и фамилией пилота Charles Leclerc',
    price: 6990,
    stock: 18,
    rating: 4.9,
    image: '../images/leclerc-shirt.jpg'
  },
  {
    id: nanoid(6),
    name: 'Модель Ferrari SF-23 1:43',
    category: 'Модели',
    description: 'Коллекционная модель болида Ferrari SF-23 сезона 2023. Масштаб 1:43',
    price: 12990,
    stock: 7,
    rating: 5.0,
    image: '../images/sf23-model.jpg'
  },
  {
    id: nanoid(6),
    name: 'Худи Ferrari F1 Team',
    category: 'Одежда',
    description: 'Теплое худи с символикой Scuderia Ferrari. Состав: хлопок 80%, полиэстер 20%',
    price: 10990,
    stock: 12,
    rating: 4.8,
    image: '../images/ferrari-hoodie.jpg'
  },
  {
    id: nanoid(6),
    name: 'Кружка Ferrari F1',
    category: 'Сувениры',
    description: 'Керамическая кружка с логотипом Scuderia Ferrari. Объем 330 мл',
    price: 1990,
    stock: 34,
    rating: 4.5,
    image: '../images/ferrari-mug.jpg'
  },
  {
    id: nanoid(6),
    name: 'Рюкзак Ferrari F1',
    category: 'Аксессуары',
    description: 'Спортивный рюкзак с отделением для ноутбука. Водонепроницаемый',
    price: 8990,
    stock: 9,
    rating: 4.6,
    image: '../images/ferrari-backpack.jpg'
  },
  {
    id: nanoid(6),
    name: 'Брелок Ferrari F1',
    category: 'Сувениры',
    description: 'Металлический брелок с эмблемой Scuderia Ferrari в подарочной упаковке',
    price: 1490,
    stock: 42,
    rating: 4.4,
    image: '../images/ferrari-keychain.jpg'
  },
  {
    id: nanoid(6),
    name: 'Поло Ferrari F1',
    category: 'Одежда',
    description: 'Классическое поло с вышитым логотипом. Цвет: красный с белыми полосками',
    price: 7990,
    stock: 15,
    rating: 4.7,
    image: '../images/ferrari-polo.jpg'
  },
  {
    id: nanoid(6),
    name: 'Плед Ferrari F1',
    category: 'Дом',
    description: 'Мягкий плед с символикой Ferrari. Размер 150x200 см',
    price: 5990,
    stock: 11,
    rating: 4.8,
    image: '../images/ferrari-blanket.jpg'
  },
  {
    id: nanoid(6),
    name: 'Набор ключей Ferrari F1',
    category: 'Аксессуары',
    description: 'Набор из 3 гаечных ключей с логотипом Ferrari для настоящих фанатов F1',
    price: 2490,
    stock: 23,
    rating: 4.3,
    image: '../images/ferrari-wrenches.jpg'
  }
];

function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 */
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock, rating, image } = req.body;

  if (!name || !category || !description || !price || !stock) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
    rating: rating ? Number(rating) : 0,
    image: image || '/images/placeholder.jpg'
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  if (req.body?.name === undefined &&
      req.body?.category === undefined &&
      req.body?.description === undefined &&
      req.body?.price === undefined &&
      req.body?.stock === undefined &&
      req.body?.rating === undefined &&
      req.body?.image === undefined) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const { name, category, description, price, stock, rating, image } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (rating !== undefined) product.rating = Number(rating);
  if (image !== undefined) product.image = image;

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const exists = products.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: "Product not found" });

  products = products.filter((p) => p.id !== id);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});