export interface IUser {
    _id: string;
    username: string;
    points: number;
}

export interface IInvite {
    _id: string;
    invitedUser: string | IUser;
    inviteUser: string | IUser;
    createdAt: Date;
}

export interface IUrlTracking {
    _id: string;
    originalUrl: string;
    tinyUrl: string;
    clicks: number;
    createdAt: Date;
} 