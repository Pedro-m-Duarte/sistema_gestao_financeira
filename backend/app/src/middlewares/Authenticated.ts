import { NextFunction, Request, Response } from "express";

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) return res.redirect("/login")
    return next()
}

export const isNotAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) return res.redirect("/")
    return next()
}