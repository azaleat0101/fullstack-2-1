const express = require('express');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const JWT_SECRET = 'my_super_secret'; 
const ACCESS_EXPIRES_IN = '15m'; 

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API практика №7',
            version: '1.0.0',
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
    },
    apis: ['./index.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Токен отсутствует' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; 
        next();            
    } catch (err) {
        return res.status(401).json({ error: 'Токен недействителен' });
    }
};

let users = [];
let products = [];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, first_name, last_name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@mail.ru
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Ошибка валидации
 */
app.post('/api/auth/register', async(req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: nanoid(),
        email,
        first_name,
        last_name,
        password: hashedPassword
    };

    users.push(newUser);
    res.status(201).json({ id: newUser.id, email, first_name, last_name });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@mail.ru
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Пользователь вошел в систему
 *       400:
 *         description: Email и пароль обязательны
 *       401:
 *         description: Ошибка в пароле
 *       404:
 *         description: Нет пользователя с такой почтой
 */
app.post('/api/auth/login', async(req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({error: 'Нет пользователя с такой почтой' });

    const result =  await bcrypt.compare(password, user.password);

    if (!result) {
        return res.status(401).json({error: 'Ошибка в пароле' })
    }

    const accessToken = jwt.sign(
        { sub: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN } 
    );
    
    return res.status(200).json({ accessToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получение текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       401:
 *         description: Токен отсутствует или недействителен
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: "Пользователь не найден "});

    res.status(200).json({ 
        id: user.id, 
        email: user.email, 
        first_name: user.first_name, 
        last_name: user.last_name 
    });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Добавление товара
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price]
 *             properties:
 *               title:
 *                 type: string
 *                 example: new product
 *               category:
 *                 type: string
 *                 example: some category
 *               description:
 *                 type: string
 *                 example: some description
 *               price:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       201:
 *         description: Товар добавлен
 *       400:
 *         description: Все поля обязательны
 */
app.post('/api/products', (req, res) => {
    const {title, category, description, price} = req.body;

    if (!title || !category || !description || !price) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    const newProduct = {
        id: nanoid(),
        title,
        category,
        description,
        price
    };

    products.push(newProduct);
    res.status(201).json({ id: newProduct.id, title, category, description, price });
});


/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Вывод всех товаров
 *     tags: [Products]
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Товары выведены
 */
app.get('/api/products', (req, res) => {
    res.status(200).json(products);
}); 

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Вывод товара по id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Товар выведен
 *       404:
 *         description: Нет товара с таким id
 */
app.get('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({error: 'Нет товара с таким id' });

    res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Изменение товара
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description, price]
 *             properties:
 *               title:
 *                 type: string
 *                 example: new product
 *               category:
 *                 type: string
 *                 example: some category
 *               description:
 *                 type: string
 *                 example: some description
 *               price:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       201:
 *         description: Товар обновлен
 *       404:
 *         description: Нет товара с таким id
 */
app.put('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({error: 'Нет товара с таким id' });

    const { title, category, description, price } = req.body;
    if (title) product.title = title;
    if (category) product.category = category;
    if (description) product.description = description;
    if (price) product.price = price;
    
    res.status(200).json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаление товара по id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Товар удален
 *       404:
 *         description: Нет товара с таким id
 */
app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({error: 'Нет товара с таким id' });

    products = products.filter(p => p.id !== req.params.id);
    res.status(200).json({ message: 'Товар удалён' });
})

app.listen(port, () => console.log(`Сервер запущен на http://localhost:${port}`));