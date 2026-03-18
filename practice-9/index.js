const express = require('express');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3001;

const ACCESS_SECRET = 'my_super_secret';
const ACCESS_EXPIRES_IN = '15m';

const REFRESH_SECRET = 'refresh_secret';
const REFRESH_EXPIRES_IN = '7d';

const refreshTokens = new Set();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

let users = [];
let products = [];

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.email,
            role: user.role,
        },
        ACCESS_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            username: user.email,
            role: user.role,
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Токен отсутствует' });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Токен недействителен' });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API практика №11',
            version: '1.0.0',
        },
        servers: [{ url: 'http://localhost:3001' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *                 example: user
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Ошибка валидации
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: nanoid(),
        email,
        first_name,
        last_name,
        password: hashedPassword,
        role: role || 'user',
        blocked: false,
    };

    users.push(newUser);

    res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
    });
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
 *       403:
 *         description: Пользователь заблокирован
 *       404:
 *         description: Нет пользователя с такой почтой
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
        return res.status(404).json({ error: 'Нет пользователя с такой почтой' });
    }

    if (user.blocked) {
        return res.status(403).json({ error: 'Пользователь заблокирован' });
    }

    const result = await bcrypt.compare(password, user.password);

    if (!result) {
        return res.status(401).json({ error: 'Ошибка в пароле' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    return res.status(200).json({ accessToken, refreshToken });
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
    const user = users.find((u) => u.id === req.user.sub);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.status(200).json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        blocked: user.blocked,
    });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: hfjdknfdkkkd.kdkdkskskkdjf.snskslwpspd
 *     responses:
 *       200:
 *         description: Токены обновлены
 *       400:
 *         description: Токена нет
 *       401:
 *         description: Токен не действителен
 */
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Нет токена' });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: 'Токен не действителен' });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find((u) => payload.sub === u.id);

        if (!user || user.blocked) {
            refreshTokens.delete(refreshToken);
            return res.status(401).json({ error: 'Токен не действителен' });
        }

        refreshTokens.delete(refreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.add(newRefreshToken);

        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({ error: 'Токен не действителен' });
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для администратора
 */
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const safeUsers = users.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        blocked: !!u.blocked,
    }));

    res.status(200).json(safeUsers);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь найден
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для администратора
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.status(200).json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        blocked: !!user.blocked,
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Петр
 *               last_name:
 *                 type: string
 *                 example: Петров
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *                 example: seller
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для администратора
 *       404:
 *         description: Пользователь не найден
 */
app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const { first_name, last_name, role } = req.body;
    const allowedRoles = ['user', 'seller', 'admin'];

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (role && allowedRoles.includes(role)) user.role = role;

    res.status(200).json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        blocked: !!user.blocked,
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь заблокирован
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для администратора
 *       404:
 *         description: Пользователь не найден
 */
app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    user.blocked = true;

    res.status(200).json({ message: 'Пользователь заблокирован' });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Добавление товара
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для продавца и администратора
 */
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const newProduct = {
        id: nanoid(),
        title,
        category,
        description,
        price,
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Вывод всех товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Товары выведены
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для авторизованных пользователей
 */
app.get('/api/products', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
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
 *     responses:
 *       200:
 *         description: Товар выведен
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Нет товара с таким id
 */
app.get('/api/products/:id', authMiddleware, roleMiddleware(['user', 'seller', 'admin']), (req, res) => {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({ error: 'Нет товара с таким id' });
    }

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
 *       200:
 *         description: Товар обновлен
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для продавца и администратора
 *       404:
 *         description: Нет товара с таким id
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({ error: 'Нет товара с таким id' });
    }

    const { title, category, description, price } = req.body;

    if (title !== undefined) product.title = title;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;

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
 *     responses:
 *       200:
 *         description: Товар удален
 *       401:
 *         description: Токен отсутствует
 *       403:
 *         description: Доступ только для администратора
 *       404:
 *         description: Нет товара с таким id
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const product = products.find((p) => p.id === req.params.id);

    if (!product) {
        return res.status(404).json({ error: 'Нет товара с таким id' });
    }

    products = products.filter((p) => p.id !== req.params.id);
    res.status(200).json({ message: 'Товар удалён' });
});

app.listen(port, () => console.log(`Сервер запущен на http://localhost:${port}`));
