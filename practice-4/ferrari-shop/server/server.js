const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const app = express();
const PORT = 3001; 

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для логирования
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

// База данных в памяти — 10 товаров Ferrari F1
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
    description: 'Набор из 4 гаечных ключей с логотипом Ferrari для настоящих фанатов F1',
    price: 3490,
    stock: 23,
    rating: 4.3,
    image: '../images/ferrari-wrenches.jpg'
  }
];

// Функция-помощник для поиска товара по ID
function findProductOr404(id, res) {
  const product = products.find(p => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

// POST /api/products — создание нового товара
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
    image: image
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// GET /api/products — получение списка всех товаров
app.get("/api/products", (req, res) => {
  res.json(products);
});

// GET /api/products/:id — получение товара по ID
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

// PATCH /api/products/:id — обновление товара
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

// DELETE /api/products/:id — удаление товара
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});