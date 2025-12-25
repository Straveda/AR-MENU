import jwt from 'jsonwebtoken'

export const isLoggedIn = async (req, res, next) => {
    try {
        // console.log(req.cookies)
        const token = req.cookies?.token;
        // console.log(token)

        if(!token){
            return res.status(400).json({
                success: false,
                message: "Token not Found"
            })
        }

        const decode = await jwt.verify(token, process.env.JWT_SECRET)
        // console.log(decode)
        req.user = decode;
        next();
    } catch (error) {
        return res.status(400).json({
            message: "Middleware Failure",
            success: false
        })
    }
}