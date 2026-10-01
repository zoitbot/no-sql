# NO-SQL 🗄️

Simulador (de humor) de pedidos al equipo de DBA. Cada pedido consume tokens, el DBA reniega,
casi siempre contesta **NO**, y si pedís demasiado te quedás sin tokens hasta el día siguiente.

## Cómo funciona

- Arrancás el día con **10.000 tokens**. Se recargan solos a la medianoche (hora local).
- Cada pedido tiene un costo: los pedidos frecuentes tienen un precio base y el texto libre se
  cobra según el tema que se detecte (o según el largo, si no se reconoce nada).
- La **paciencia del DBA** baja con cada pedido. Con poca paciencia hay recargo por renegar
  (hasta ×2) y más respuestas que son un `NO.` a secas. Recupera un punto por minuto sin pedidos.
- Decir que algo es "urgente" cuesta un 50 % más.
- Sin tokens no se puede pedir nada. Se pueden conseguir algunos más llevándole facturas o
  cebándole mates (con cupo diario).
- El historial y el saldo se guardan en el `localStorage` del navegador. No hay servidor.

## Probarlo en tu máquina

No hay dependencias ni paso de compilación. Abrí `index.html` en el navegador o levantá un
servidor estático:

```bash
python3 -m http.server 8000
```

## Publicarlo en GitHub Pages

1. Subí el repositorio a GitHub con estos archivos en la raíz de la rama `main`.
2. En el repositorio: **Settings → Pages**.
3. En **Build and deployment**, elegí **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
4. Al minuto queda publicado en `https://<usuario>.github.io/<repositorio>/`.

## Personalizarlo

Todo el contenido está al principio de `app.js`:

- `TOKENS_DIARIOS`: saldo inicial de cada día.
- `PEDIDOS`: pedidos frecuentes, con su costo y las respuestas propias de cada uno.
- `RESPUESTAS_NO`, `RESPUESTAS_GENERICAS`, `RESPUESTAS_APROBADO`: las frases del DBA.
- `RECARGAS`: las formas de conseguir más tokens.
