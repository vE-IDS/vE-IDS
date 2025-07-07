import { VatsimUser } from "@/types/vatsim.type";
import { User } from "@prisma/client";
import { OAuthConfig, Provider } from "next-auth/providers/index";

export const vatsimProvider: Provider = {
    id: 'vatsim',
    name: 'VATSIM',
    type: 'oauth',

    clientId: process.env.VATSIM_CLIENT_ID,
    clientSecret: process.env.VATSIM_CLIENT_SECRET,
    authorization: { 
        url: `${process.env.VATSIM_AUTH_URL}/oauth/authorize`,
        params: { 
            scope: 'full_name email vatsim_details country' 
        } 
    },
    token: {
        url: `${process.env.VATSIM_AUTH_URL}/oauth/token`
    },
    userinfo: {
        url: `${process.env.VATSIM_AUTH_URL}/api/user`
    },
    
    profile(profile: VatsimUser) {
        return {
            id: profile.data.cid,
            cid: profile.data.cid,
            firstName: profile.data.personal.name_first,
            lastName: profile.data.personal.name_last,
            email: profile.data.personal.email,
            rating: profile.data.vatsim.rating.id
        } as User
    },
} satisfies OAuthConfig<any>;