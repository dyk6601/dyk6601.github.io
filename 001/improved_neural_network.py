import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

# Load and preprocess the data
digits = load_digits()
X = digits.data
y = digits.target

# Convert labels to one-hot vectors
y_one_hot = np.zeros((y.shape[0], 10))
for i in range(y.shape[0]):
    y_one_hot[i, y[i]] = 1

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y_one_hot, test_size=0.2, random_state=42)

# Normalize the data
X_train = X_train.T / 255.0
X_test = X_test.T / 255.0
y_train = y_train.T
y_test = y_test.T

# Define activation functions and their derivatives
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

def sigmoid_derivative(z):
    return sigmoid(z) * (1 - sigmoid(z))

def relu(z):
    return np.maximum(0, z)

def relu_derivative(z):
    return (z > 0).astype(float)

def leaky_relu(z, alpha=0.01):
    return np.where(z > 0, z, alpha * z)

def leaky_relu_derivative(z, alpha=0.01):
    return np.where(z > 0, 1, alpha)

def tanh(z):
    return np.tanh(z)

def tanh_derivative(z):
    return 1 - np.tanh(z)**2

def elu(z, alpha=1.0):
    return np.where(z > 0, z, alpha * (np.exp(z) - 1))

def elu_derivative(z, alpha=1.0):
    return np.where(z > 0, 1, alpha * np.exp(z))

# Initialize weights with Xavier/Glorot initialization
def initialize_weights(nn_structure, activation='sigmoid'):
    W = {}
    b = {}
    for l in range(1, len(nn_structure)):
        if activation == 'sigmoid':
            # Xavier initialization for sigmoid
            W[l] = np.random.randn(nn_structure[l], nn_structure[l-1]) * np.sqrt(2.0 / (nn_structure[l-1] + nn_structure[l]))
        else:
            # He initialization for ReLU and variants
            W[l] = np.random.randn(nn_structure[l], nn_structure[l-1]) * np.sqrt(2.0 / nn_structure[l-1])
        b[l] = np.zeros((nn_structure[l], 1))
    return W, b

# Feed forward algorithm
def feed_forward(x, W, b, activation='sigmoid'):
    h = {1: x}
    z = {}
    for l in range(1, len(W) + 1):
        if l == 1:
            node_in = x
        else:
            node_in = h[l]
        
        z[l+1] = W[l].dot(node_in) + b[l]
        
        if activation == 'sigmoid':
            h[l+1] = sigmoid(z[l+1])
        elif activation == 'relu':
            h[l+1] = relu(z[l+1])
        elif activation == 'leaky_relu':
            h[l+1] = leaky_relu(z[l+1])
        elif activation == 'tanh':
            h[l+1] = tanh(z[l+1])
        elif activation == 'elu':
            h[l+1] = elu(z[l+1])
            
    return h, z

# Calculate deltas for backpropagation
def calculate_out_layer_delta(y, h_out, z_out, activation='sigmoid'):
    if activation == 'sigmoid':
        return -(y - h_out) * sigmoid_derivative(z_out)
    elif activation == 'relu':
        return -(y - h_out) * relu_derivative(z_out)
    elif activation == 'leaky_relu':
        return -(y - h_out) * leaky_relu_derivative(z_out)
    elif activation == 'tanh':
        return -(y - h_out) * tanh_derivative(z_out)
    elif activation == 'elu':
        return -(y - h_out) * elu_derivative(z_out)

def calculate_hidden_delta(delta_plus_1, w_l, z_l, activation='sigmoid'):
    if activation == 'sigmoid':
        return np.dot(np.transpose(w_l), delta_plus_1) * sigmoid_derivative(z_l)
    elif activation == 'relu':
        return np.dot(np.transpose(w_l), delta_plus_1) * relu_derivative(z_l)
    elif activation == 'leaky_relu':
        return np.dot(np.transpose(w_l), delta_plus_1) * leaky_relu_derivative(z_l)
    elif activation == 'tanh':
        return np.dot(np.transpose(w_l), delta_plus_1) * tanh_derivative(z_l)
    elif activation == 'elu':
        return np.dot(np.transpose(w_l), delta_plus_1) * elu_derivative(z_l)

# Training function with regularization
def train_nn(nn_structure, X, y, iter_num=3000, alpha=0.1, reg_lambda=0.01, activation='sigmoid'):
    W, b = initialize_weights(nn_structure, activation)
    cnt = 0
    m = len(y)
    avg_cost_func = []
    
    print('Starting gradient descent for {} iterations'.format(iter_num))
    
    while cnt < iter_num:
        if cnt % 1000 == 0:
            print('Iteration {} of {}'.format(cnt, iter_num))
        
        delta_W = {}
        delta_b = {}
        for l in range(len(nn_structure), 0, -1):
            delta_W[l] = np.zeros((nn_structure[l-1], nn_structure[l]))
            delta_b[l] = np.zeros((nn_structure[l], 1))
        
        for i in range(len(y)):
            delta = {}
            h, z = feed_forward(X[:, i].reshape(-1, 1), W, b, activation)
            
            for l in range(len(nn_structure), 0, -1):
                if l == len(nn_structure):
                    delta[l] = calculate_out_layer_delta(y[:, i].reshape(-1, 1), h[l], z[l], activation)
                else:
                    if l > 1:
                        delta[l] = calculate_hidden_delta(delta[l+1], W[l], z[l], activation)
                    delta_W[l] += np.dot(delta[l+1], np.transpose(h[l]))
                    delta_b[l] += delta[l+1]
        
        for l in range(len(nn_structure) - 1, 0, -1):
            # Add L2 regularization
            W[l] = W[l] - alpha * (delta_W[l] / m + reg_lambda * W[l])
            b[l] = b[l] - alpha * (delta_b[l] / m)
        
        avg_cost = 0
        for i in range(len(y)):
            h, _ = feed_forward(X[:, i].reshape(-1, 1), W, b, activation)
            avg_cost += np.linalg.norm(y[:, i].reshape(-1, 1) - h[len(nn_structure)])**2
        
        # Add L2 regularization term to cost
        reg_term = 0
        for l in range(1, len(nn_structure)):
            reg_term += np.sum(W[l]**2)
        avg_cost = (1/m) * avg_cost + (reg_lambda/(2*m)) * reg_term
        
        avg_cost_func.append(avg_cost)
        cnt += 1
        
    return W, b, avg_cost_func

# Prediction function
def predict_y(W, b, X, n_layers, activation='sigmoid'):
    m = X.shape[1]
    y = np.zeros((10, m))
    
    for i in range(m):
        h, _ = feed_forward(X[:, i].reshape(-1, 1), W, b, activation)
        y[:, i] = h[n_layers].reshape(10,)
        
    return np.argmax(y, axis=0)

# Main function to run experiments
def run_experiments():
    # Define network structures to try
    structures = [
        [64, 30, 10],  # Original structure
        [64, 50, 30, 10],  # Deeper network
        [64, 100, 50, 10],  # Even deeper network
    ]
    
    # Define activation functions to try
    activations = ['sigmoid', 'relu', 'leaky_relu', 'tanh', 'elu']
    
    # Define regularization parameters to try
    reg_lambdas = [0.0, 0.01, 0.1]
    
    # Define learning rates to try
    alphas = [0.1, 0.01, 0.001]
    
    best_accuracy = 0
    best_params = {}
    
    for structure in structures:
        for activation in activations:
            for reg_lambda in reg_lambdas:
                for alpha in alphas:
                    print(f"\nTesting structure: {structure}, activation: {activation}, reg_lambda: {reg_lambda}, alpha: {alpha}")
                    
                    # Train the network
                    W, b, cost = train_nn(
                        structure,
                        X_train,
                        y_train,
                        iter_num=5000,  # Increased iterations
                        alpha=alpha,
                        reg_lambda=reg_lambda,
                        activation=activation
                    )
                    
                    # Make predictions
                    y_pred = predict_y(W, b, X_test, len(structure), activation)
                    y_true = np.argmax(y_test, axis=0)
                    
                    # Calculate accuracy
                    accuracy = np.mean(y_pred == y_true)
                    print(f"Accuracy: {accuracy:.4f}")
                    
                    # Update best parameters
                    if accuracy > best_accuracy:
                        best_accuracy = accuracy
                        best_params = {
                            'structure': structure,
                            'activation': activation,
                            'reg_lambda': reg_lambda,
                            'alpha': alpha
                        }
    
    print("\nBest parameters found:")
    print(f"Structure: {best_params['structure']}")
    print(f"Activation: {best_params['activation']}")
    print(f"Regularization lambda: {best_params['reg_lambda']}")
    print(f"Learning rate: {best_params['alpha']}")
    print(f"Best accuracy: {best_accuracy:.4f}")

if __name__ == "__main__":
    run_experiments() 