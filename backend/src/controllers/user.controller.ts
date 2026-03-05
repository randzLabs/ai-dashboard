// src/controllers/user.controller.ts
export class UserController {
  // GET /api/v1/users — Admin only
  async listUsers(req: AuthRequest, res: Response) {
    const users = await prisma.user.findMany({
      where: {
        organizationId: req.user!.orgId, // ← WAJIB: multi-tenant isolation
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return res.json({ data: users });
  }

  // POST /api/v1/users/invite
  async inviteUser(req: AuthRequest, res: Response) {
    const { email, name, role } = inviteSchema.parse(req.body);

    // Cek user sudah ada di org ini
    const exists = await prisma.user.findFirst({
      where: { email, organizationId: req.user!.orgId, deletedAt: null },
    });
    if (exists) throw new AppError("User dengan email ini sudah ada", 409);

    // Buat user dengan temp password
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        organizationId: req.user!.orgId,
        name,
        email,
        passwordHash: hash,
        role,
      },
    });

    // Kirim email invitation dengan link set-password
    await emailService.sendInvitation(email, name, req.user!.orgId);
    await auditLog(req.user!.userId, "CREATE", "users", user.id, null, {
      email,
      role,
    });

    return res.status(201).json({ data: user, message: "Undangan terkirim" });
  }

  // PUT /api/v1/users/:id/role — Admin only
  async updateRole(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { role } = req.body;

    // Pastikan user berada dalam org yang sama
    const user = await prisma.user.findFirst({
      where: { id, organizationId: req.user!.orgId, deletedAt: null },
    });
    if (!user) throw new AppError("User tidak ditemukan", 404);

    const oldRole = user.role;
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    await auditLog(
      req.user!.userId,
      "UPDATE",
      "users",
      id,
      { role: oldRole },
      { role },
    );

    return res.json({ data: updated });
  }

  // DELETE /api/v1/users/:id — Soft delete
  async deleteUser(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (id === req.user!.userId)
      throw new AppError("Tidak bisa hapus akun sendiri", 400);

    const user = await prisma.user.findFirst({
      where: { id, organizationId: req.user!.orgId, deletedAt: null },
    });
    if (!user) throw new AppError("User tidak ditemukan", 404);

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await auditLog(
      req.user!.userId,
      "DELETE",
      "users",
      id,
      { email: user.email },
      null,
    );

    return res.json({ message: "User berhasil dihapus" });
  }
}
