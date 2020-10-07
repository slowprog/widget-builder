# Сборка виджетов

Для сборки необходимо в корне проекта запустить контейнер с билдером прокинув в него файлы проекта:

```
# Сборка для разработки
docker run -v $(pwd):/app slowprog/widget-builder:latest dev
# Сборка для релиза виджета
docker run -v $(pwd):/app slowprog/widget-builder:latest prod
```

После этого в корне проекта появится widget.zip, который можно загружать в интеграцию.