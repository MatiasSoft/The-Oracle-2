// Algoritmo TF-IDF (Term Frecuency - Inverse Document Frecuency)
// 'ATENCION'se llamara texto a los scripts de python para mayor comprension.
import {useCallback} from 'react';


// Aca creamos una funcion que recibe texto y devuelve una lista de palabras.
const tokenize = (code) => {
   return code.toLowerCase().match(/\b\w+\b/g) || [];
}

// Ahora tenemos que definir el vocabulario
// El vocabulario es una lista de palabras unicas que aparecieron en ambos textos
// Para ello vamos a definir una funcion

export const useCodeSimilarity = () => {
    const calculateSimilarity = (codeA, codeB) => {
        // primero utilizamos la funcion tokenize para tener la lista de palabras de cada texto
        const tokensA = tokenize(codeA);
        const tokensB = tokenize(codeB);

        // creamos un array con las palabras de ambos codigos
        const allTokens = [...tokensA, ...tokensB];


        // Guardamos los documentos en un array para proximos pasos
        const documents = [tokensA, tokensB]
        // pero ahora tenemos que eliminar las palabras repetidas 
        const vocabulary = new Set(allTokens);

        // la variable vocabulary ahora contiene todas las palabras (No repetidas) de ambos textos



        // Ahora que tenemos nuestro diccionario de palabras únicas (vocabulary)
        // necesitamos saber cuántas veces aparece cada palabra en cada uno de los archivos de código. 
        // Esto se llama Frecuencia del Término o TF.
        // Vamos a calcular el TF de cada texto (Del texto A y B).

        const tfA = new Map()

        for (const token of tokensA){
            const currentCount = tfA.get(token) || 0;
            tfA.set(token, currentCount + 1)
        }

        // ahora convertimos el conteo a frecuencia (contador / total de palabras)
        tfA.forEach((count, token) => {
            tfA.set(token, count/tokensA.length);
        });

        // hacemos lo mismo para el texto B

            const tfB = new Map()

        for (const token of tokensB){
            const currentCount = tfB.get(token) || 0;
            tfB.set(token, currentCount + 1)
        }

        tfB.forEach((count, token) => {
            tfB.set(token, count/tokensB.length);
        });


        // Ahora hay que calcular el IDF
        // Es decir ahora tenemos que calcular la importancia de cada palabra
        // Las palabras muy comunes en ambos documentos tendran un IDF bajo (poca importancia)
        // Las palabras que solo aparecen en uno de los documentos tendran un IDF alto (mucha importancia)
        // Vamos a utilizar una formula matematica para este calculo de "importancia" de las palabras

        const idf = new Map();

        // Recorremos las palabras del vocabulario
        vocabulary.forEach(token => {
            //Contamos en cuantos documentos aparece el token
            const docsWithToken = documents.filter(doc => doc.includes(token)).length;
            // Nuestra variable docWithToken contiene la cantidad de documentos que contiene la palabra del diccionario que se este recorriendo en un instante
            // Con instante hacemos referencia a la iteracion del forEach que recorre cada palabra del diccionario

            // Ahora vamos a aplicar la formula IDF (Se encuenta en internet)
            // Entonces ahora en el Map que creamos de idf vamos a guardar el token (osea la palabra) junto con su "importancia" calculada con la siguiente formula:
            idf.set(token, Math.log(documents.length / (1 + docsWithToken)));

            // Se agrega el 1 + al divisor, esto se denomina suavisado de laplace, hace que el calculo sea mas robusto
        });

        // Ahora que tenemos el TF y IDF de cada palabra, el siguiente paso es combinarlos para crear
        // la "huella digital" numerica de cada codigo, A esto lo llamamos vector TF-IDF

        // Para cada palabra en nuestro vocabulario, vamos a multiplicar su valor de TF por su valor de IDF 
        
        // Creamos los vectores vacios
        const vectorA = []
        const vectorB = []

        // Recorremos cada palabra del vocabulario
        vocabulary.forEach(token => {

            // Obtenemos el valor IDF de la palabra en cada iteracion, si no existe es 0
            const idfValue = idf.get(token) || 0;

            // Obtenemos el TF de la palabra para cada codigo/texto 
            const tfAValue = tfA.get(token) || 0;
            const tfBValue = tfB.get(token) || 0;

            // Multiplicamos TF * IDF para obtener el valor del vector.
            const tfidfA = tfAValue * idfValue;
            const tfidfB = tfBValue * idfValue;

            // Agregamos los valores a los vectores
            vectorA.push(tfidfA);
            vectorB.push(tfidfB);

        })
    
        // Aquí es donde usamos los dos vectores que acabas de crear para calcular un valor entre 0 y 1, 
        // donde 1 es la similitud máxima.

        // Vamos a calcular la formula de similitud del coseno para ellos necesitaremos calcular:
        // - producto punto
        // - la magnitud de cada vector


        // Creamos las variables para el calculo
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        // Recorremos los vectores para calcular el producto punto y las magnitudes
        for (let i = 0; i < vectorA.length; i++) {
            // Producto punto: Multiplicamos cada posición de los vectores y lo sumamos.
            dotProduct += vectorA[i] * vectorB[i];
            
            // Magnitud: Elevamos al cuadrado cada valor y lo sumamos.
            magnitudeA += vectorA[i] * vectorA[i];
            magnitudeB += vectorB[i] * vectorB[i];
        }

        // Calculamos la raíz cuadrada para obtener las magnitudes finales.
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        // Verificamos si alguna magnitud es cero para evitar una división por cero.
        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        // Aplicamos la fórmula final y devolvemos el resultado.
        return dotProduct / (magnitudeA * magnitudeB);
        
    }

    return { calculateSimilarity };

}
