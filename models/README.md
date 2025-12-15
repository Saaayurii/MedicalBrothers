# Piper TTS Models

Эта директория содержит модели для Piper TTS - бесплатного синтезатора речи с высоким качеством.

## Скачивание моделей

### Русский язык (рекомендуется)

#### Модель Ruslan (средняя, мужской голос)
```bash
cd models
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx.json
```

Или через curl:
```bash
curl -L -o models/ru_RU-ruslan-medium.onnx \
  "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx"
curl -L -o models/ru_RU-ruslan-medium.onnx.json \
  "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium.onnx.json"
```

**Размер модели:** ~50 MB
**Качество:** Отличное
**Скорость:** Быстрая

### Альтернативные русские модели

#### Irina (женский голос, легче)
```bash
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/irina/medium/ru_RU-irina-medium.onnx.json
```

#### Dmitri (мужской голос, более качественный)
```bash
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ru/ru_RU/dmitri/medium/ru_RU-dmitri-medium.onnx.json
```

## Проверка скачанных моделей

После скачивания проверьте размер файлов:
```bash
ls -lh models/*.onnx
```

Модели должны быть размером **40-80 MB**. Если файл меньше 1 MB - скачивание прошло неудачно, попробуйте снова.

## Тестирование модели

Проверьте работу Piper TTS:
```bash
# Активируйте venv
source venv/bin/activate

# Протестируйте модель
echo "Привет, это тест голосового синтеза" | piper \
  --model models/ru_RU-ruslan-medium.onnx \
  --output_file test.wav

# Прослушайте результат (Linux)
aplay test.wav

# Прослушайте результат (Mac)
afplay test.wav
```

## Все доступные модели

Полный список доступных языков и голосов:
https://github.com/rhasspy/piper/blob/master/VOICES.md

## Использование в приложении

После скачивания модели приложение автоматически будет использовать Piper TTS для озвучки ответов голосового ассистента.

Endpoint: `POST /api/voice/piper-speak`

Система автоматически выберет лучший метод озвучки:
1. Сначала пытается использовать Web Speech API (встроенный в браузер)
2. Если не работает - переключается на Piper TTS
3. Если Piper недоступен - пытается OpenAI TTS (если настроен)

## Troubleshooting

### Модель не скачивается
Если wget/curl не работают, скачайте модель вручную:
1. Откройте https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0/ru/ru_RU/ruslan/medium
2. Скачайте файлы `ru_RU-ruslan-medium.onnx` и `ru_RU-ruslan-medium.onnx.json`
3. Поместите их в папку `models/`

### Piper не найден
```bash
# Убедитесь, что Piper установлен в venv
source venv/bin/activate
which piper

# Если не установлен:
pip install piper-tts
```

### Ошибка "Model not found"
Проверьте, что модель находится по пути:
```
models/ru_RU-ruslan-medium.onnx
models/ru_RU-ruslan-medium.onnx.json
```

## Поддержка

Вопросы? Создайте issue в репозитории проекта.
