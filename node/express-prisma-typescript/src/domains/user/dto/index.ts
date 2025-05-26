export class UserDTO {
  constructor (user: any) {
    this.id = user.id
    this.username = user.username
    this.name = user.name
    this.createdAt = user.createdAt
    this.private = user.private ?? false
    this.profileImageUrl = user.profileImageUrl ?? null
  }

  id: string
  username: string
  name: string | null
  createdAt: Date
  private: boolean
  profileImageUrl: string | null
}

export class ExtendedUserDTO extends UserDTO {
  constructor (user: any) {
    super(user)
    this.email = user.email
    this.password = user.password
    this.profileImageKey = user.profileImageKey
  }

  email!: string
  password!: string
  profileImageKey?: string | null
}

export class UserViewDTO {
  constructor (user: any) {
    this.id = user.id
    this.name = user.name
    this.username = user.username
    this.profileImageUrl = user.profileImageUrl
  }

  id: string
  name: string
  username: string
  profileImageUrl: string | null
}
