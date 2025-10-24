// Константа для инициализации генератора (64-ричное число)
var MYRANDOM = {}

MYRANDOM.generation_seed = "1A3F5C7E9B2D4F6A"; // 64-ричное число

// Функция для генерации случайного сида на основе Math.random
MYRANDOM.generateRandomSeed = function() {
    // Генерируем случайное 64-ричное число длиной 16 символов
    const base64Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";
    let randomSeed = "";
    
    for (let i = 0; i < 16; i++) {
        const randomIndex = Math.floor(Math.random() * base64Chars.length);
        randomSeed += base64Chars[randomIndex];
    }
    
    return randomSeed;
}


// Функция для генерации сида из массива случайных элементов
MYRANDOM.generateArrayBasedSeed = function() {
    const base64Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/".split('');
    let randomSeed = "";
    
    for (let i = 0; i < 16; i++) {
        // Перемешиваем массив и берем первый элемент
        const shuffledArray = [...base64Chars].sort(() => Math.random() - 0.5);
        randomSeed += shuffledArray[0];
    }
    
    return randomSeed;
}

// Преобразуем 64-ричное число в десятичное
MYRANDOM.base64ToDecimal = function(base64Str) {
    const base64Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/";
    let decimal = 0n;
    
    for (let i = 0; i < base64Str.length; i++) {
        const char = base64Str[i];
        const value = BigInt(base64Chars.indexOf(char));
        decimal = decimal * 64n + value;
    }
    
    return Number(decimal % BigInt(2**32));
}

// Инициализация seed (может быть перезаписана случайным сидом)
MYRANDOM.generation_seed = MYRANDOM.generateRandomSeed()
MYRANDOM.seed = MYRANDOM.base64ToDecimal(MYRANDOM.generation_seed);

// Функция для генерации псевдослучайного числа
MYRANDOM.random = function(min = 0, max = 1) {
    // Параметры LCG (стандартные для многих реализаций)
    const a = 1664525;
    const c = 1013904223;
    const m = 2**32;
    
    min = (typeof min === "number") ? min : 0
    max = (typeof max === "number") ? max : 1
    
    // Генерируем следующее значение seed
    MYRANDOM.seed = (a * MYRANDOM.seed + c) % m;
    
    // Преобразуем в число в диапазоне [0, 1)
    const randomValue = MYRANDOM.seed / m;
    
    // Масштабируем до нужного диапазона [min, max]
    return min + randomValue * (max - min);
}

MYRANDOM.randInt = function(min = 0, max = 1) {
    return min + Math.floor(MYRANDOM.random() * (max - min + 1))
}

MYRANDOM.choice = function(array) {
    return array[MYRANDOM.randInt(0, array.length - 1)]
}

MYRANDOM.shuffle = function(array) {
    var s = []
    	while (array.length) s.push(array.splice((MYRANDOM.random() * array.length)|0, 1)[0])
    	while (s.length) array.push(s.pop())
}

// Функция для установки нового случайного сида
MYRANDOM.setRandomSeed = function(useCrypto = false) {
    const newSeed = useCrypto ? MYRANDOM.generateCryptoSecureSeed() : MYRANDOM.generateRandomSeed();
    //console.log("Новый случайный seed (64-ричный):", newSeed);
    MYRANDOM.seed = MYRANDOM.base64ToDecimal(newSeed);
    return newSeed;
}

// Функция для установки сида на основе массива
MYRANDOM.setArrayBasedSeed = function() {
    const newSeed = MYRANDOM.generateArrayBasedSeed();
    //console.log("Новый seed на основе массива (64-ричный):", newSeed);
    MYRANDOM.seed = MYRANDOM.base64ToDecimal(newSeed);
    return newSeed;
}

// Функция для сброса seed к исходному значению
MYRANDOM.resetSeed = function() {
    MYRANDOM.seed = base64ToDecimal(generation_seed);
    //console.log("Seed сброшен к исходному значению");
}

// Утилита для проверки распределения
MYRANDOM.testDistribution = function(iterations = 10000) {
    const buckets = [0, 0, 0, 0, 0]; // 5 корзин
    
    for (let i = 0; i < iterations; i++) {
        const value = random();
        const bucket = Math.floor(value * buckets.length);
        if (bucket < buckets.length) {
            buckets[bucket]++;
        }
    }
    
    console.log("\n--- Тест распределения ---");
    buckets.forEach((count, index) => {
        const percentage = (count / iterations * 100).toFixed(1);
        const range = `[${(index / buckets.length).toFixed(1)}-${((index + 1) / buckets.length).toFixed(1)})`;
        console.log(`${range}: ${percentage}%`);
    });
}