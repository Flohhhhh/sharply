"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Badge } from "~/components/ui/badge";
import type { UserRole } from "~/server/auth";

type AdminUserListResponseItem = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  memberNumber: number;
  createdAt: string;
};

type AdminUserListRecord = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  memberNumber: number;
  createdAt: Date | null;
};

const roleOptions = [
  "ALL",
  "SUPERADMIN",
  "ADMIN",
  "EDITOR",
  "USER",
  "MODERATOR",
] as const;
const pageSizeOptions = [10, 20, 50] as const;

export function AdminUserList() {
  const [users, setUsers] = useState<AdminUserListRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] =
    useState<(typeof roleOptions)[number]>("ALL");
  const [pageSize, setPageSize] =
    useState<(typeof pageSizeOptions)[number]>(10);
  const [currentPage, setCurrentPage] = useState<number>(0);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch("/api/admin/users", {
          method: "GET",
          signal: abortController.signal,
        });
        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(responseText || "Failed to load users");
        }
        const responseBody = (await response.json()) as {
          users: AdminUserListResponseItem[];
        };
        if (!isMounted) return;
        const normalizedUsers = (responseBody.users ?? []).map((user) => ({
          ...user,
          createdAt: user.createdAt ? new Date(user.createdAt) : null,
        }));
        setUsers(normalizedUsers);
      } catch (error) {
        if (abortController.signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "Unable to load users";
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    void loadUsers();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [nameFilter, roleFilter, pageSize]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = nameFilter.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole =
        roleFilter === "ALL" ? true : user.role === roleFilter;
      const matchesName =
        normalizedQuery.length === 0 ||
        user.name?.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);
      return matchesRole && matchesName;
    });
  }, [users, nameFilter, roleFilter]);

  const totalPages = useMemo(() => {
    if (filteredUsers.length === 0) return 0;
    return Math.ceil(filteredUsers.length / pageSize);
  }, [filteredUsers.length, pageSize]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(0);
      return;
    }
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(totalPages - 1, 0));
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || (totalPages > 0 && nextPage >= totalPages)) return;
    setCurrentPage(nextPage);
  };

  const formatDate = (dateValue: Date | null) => {
    if (!dateValue) return "—";
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(dateValue);
    } catch {
      return "—";
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Quick view of all users with search and pagination.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[220px] flex-1 space-y-2">
            <label className="text-sm font-medium">
              Filter by name or email
            </label>
            <Input
              placeholder="Search users"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
            />
          </div>
          <div className="w-48 space-y-2">
            <label className="text-sm font-medium">Filter by role</label>
            <Select
              value={roleFilter}
              onValueChange={(value) =>
                setRoleFilter(value as (typeof roleOptions)[number])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === "ALL" ? "All roles" : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-36 space-y-2">
            <label className="text-sm font-medium">Rows per page</label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) =>
                setPageSize(Number(value) as (typeof pageSizeOptions)[number])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {errorMessage ? (
          <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Member #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[110px]">Role</TableHead>
                <TableHead className="w-[140px]">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">
                      {user.memberNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {filteredUsers.length} total
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageChange(currentPage - 1);
                  }}
                  aria-disabled={currentPage === 0}
                  className={
                    currentPage === 0
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, pageIndex) => (
                <PaginationItem key={pageIndex}>
                  <PaginationLink
                    href="#"
                    isActive={pageIndex === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(pageIndex);
                    }}
                  >
                    {pageIndex + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageChange(currentPage + 1);
                  }}
                  aria-disabled={
                    totalPages === 0 || currentPage + 1 >= totalPages
                  }
                  className={
                    totalPages === 0 || currentPage + 1 >= totalPages
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
