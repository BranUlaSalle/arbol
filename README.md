```text
          E
         /|\
        T * F
        |  /|\
       id ( E  )  <-- [')' insertado]
           /|\
          E + T
          |   |
         id  id

```
# id * (id + id 

* **Estrategia:** Recuperación a nivel de frase (*Phrase-level recovery*).
* **Acción:** Al detectar el fin de cadena (*EOF*) sin cerrar la expresión, el analizador sintáctico inserta localmente el token `)` faltante en la pila de análisis para completar la regla $F \rightarrow ( E )$ y continuar con el proceso.
