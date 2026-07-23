export function auth(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token !== process.env.API_TOKEN) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    next();
}