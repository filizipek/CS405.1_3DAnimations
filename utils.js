function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        0.17677669, -0.28661165,  0.7391989,  0.3,
        0.30618623,  0.36959946,  0.2803301,  -0.25,
        -0.35355338, 0.17677669,  0.61237246,  0.0,
        0.0,        0.0,        0.0,        1.0
    ]);    
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */


/*
 * translation:
		0.3 units in x-axis
		-0.25 units in y-axis
	scaling:
		0.5 by x-axis
		0.5 by y-axis
	rotation:
		30 degrees on x-axis
		45 degrees on y-axis
		60 degrees on z-axis
*/
        
function getModelViewMatrix() {

    // Transformations
    let rotation = [30, 45, 60]; // Rotation angles in degrees
    let translation = [0.3, -0.25, 0]; // Translation values
    let scale = [0.5, 0.5, 1]; // Scaling values
    
    // Convert degrees to radians
    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    // Combine transformations: Translation, Scaling, Rotation X, Y, Z
    let matrix = createIdentityMatrix();
    matrix = multiplyMatrices(matrix, createTranslationMatrix(translation[0], translation[1], translation[2])); // Translation
    matrix = multiplyMatrices(matrix, createScaleMatrix(scale[0], scale[1], scale[2])); // Scaling
    matrix = multiplyMatrices(matrix, createRotationMatrix_X(degToRad(rotation[0]))); // X-axis rotation
    matrix = multiplyMatrices(matrix, createRotationMatrix_Y(degToRad(rotation[1]))); // Y-axis rotation
    matrix = multiplyMatrices(matrix, createRotationMatrix_Z(degToRad(rotation[2]))); // Z-axis rotation
    
    const transformationMatrix = new Float32Array(matrix);

    
    return transformationMatrix;
}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement(startTime) {
    const duration = 10; // Total cycle time in seconds
    const halfDuration = duration / 2; // 5 seconds for transition in each direction

    // Calculate the current time since the animation started
    const currentTime = performance.now(); 
    const normalizedTime = (currentTime / 1000) % duration; // Current time within the 10-second cycle

    // Interpolation progress t
    let t;
    if (normalizedTime <= halfDuration) {
        t = normalizedTime / halfDuration; // Progress from 0 to 1 in the first 5 seconds
    } else {
        t = (duration - normalizedTime) / halfDuration; // Progress from 1 to 0 in the last 5 seconds
    }

    // Identity matrix (initial cube position)
    const identityMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    // Final transformation matrix (calculated earlier)
    const targetMatrix = getModelViewMatrix(); // Ensure this function is defined and returns a valid matrix

    // Interpolate between the identity matrix and the target transformation
    const resultMatrix = new Float32Array(16);
    for (let i = 0; i < 16; i++) {
        resultMatrix[i] = identityMatrix[i] * (1 - t) + targetMatrix[i] * t;
    }

    requestAnimationFrame(getPeriodicMovement); // Continue the animation

    return resultMatrix; // Optionally return the interpolated matrix
}

