import { User } from "../models/user.models.js"
import bcrypt from "bcryptjs"
import { signToken } from "../utils/jwt.js"

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            })
        }

        const user = await User.findOne({ email })

        if (!user || user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: "Invalid user"
            })
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password)

        if (!isPasswordMatched) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const token = signToken({
            id: user._id,
            role: user.role,
            restaurantId: user.restaurantId
        })

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                restaurantId: user.restaurantId,
                department: user.department,
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        })
    }
}