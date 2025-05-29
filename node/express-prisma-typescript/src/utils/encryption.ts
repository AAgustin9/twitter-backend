import crypto from 'crypto'

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export class EncryptionService {
  /**
   * Generate RSA key pair for a user
   */
  static generateKeyPair(): KeyPair {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    return { publicKey, privateKey }
  }

  /**
   * Encrypt a message using the recipient's public key
   */
  static encryptMessage(message: string, publicKey: string): string {
    const buffer = Buffer.from(message, 'utf8')
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    )
    return encrypted.toString('base64')
  }

  /**
   * Decrypt a message using the recipient's private key
   */
  static decryptMessage(encryptedMessage: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedMessage, 'base64')
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    )
    return decrypted.toString('utf8')
  }

  /**
   * Encrypt private key with user's password (for storage)
   */
  static encryptPrivateKey(privateKey: string, password: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', password)
    let encrypted = cipher.update(privateKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }

  /**
   * Decrypt private key with user's password
   */
  static decryptPrivateKey(encryptedPrivateKey: string, password: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', password)
    let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
} 