BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "users" (
    "userId" INTEGER NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "secret" TEXT,
    "is_admin" INTEGER CHECK("is_admin" = 0 OR "is_admin" = 1),
    "lastTotpStep" INTEGER,
    PRIMARY KEY("userId" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "seats" (
    "row_label" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "category" TEXT NOT NULL CHECK("category" = 'normal' OR "category" = 'premium'),
    PRIMARY KEY("row_label", "seatNumber")
);

CREATE TABLE IF NOT EXISTS "reservations" (
    "id" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT),
    FOREIGN KEY("userId") REFERENCES "users"("userId")
);

CREATE TABLE IF NOT EXISTS "seatsReserved" (
    "reservationId" INTEGER NOT NULL,
    "row_label" TEXT NOT NULL, 
    "seatNumber" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    PRIMARY KEY("row_label", "seatNumber"),
    FOREIGN KEY("reservationId") REFERENCES "reservations"("id"),
    FOREIGN KEY("row_label", "seatNumber") REFERENCES "seats"("row_label", "seatNumber"),
    FOREIGN KEY("userId") REFERENCES "users"("userId")
);

CREATE TABLE IF NOT EXISTS "seatsReleased" (
    "id" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "row_label" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "dateDelete" TEXT NOT NULL,
    PRIMARY KEY("id" AUTOINCREMENT),
    FOREIGN KEY("userId") REFERENCES "users"("userId"),
    FOREIGN KEY("row_label", "seatNumber") REFERENCES "seats"("row_label", "seatNumber")
);



INSERT INTO "users" VALUES (1, 'u1@p.it', 'Giuseppe', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI', 1, 0);
INSERT INTO "users" VALUES (2, 'u2@p.it', 'DonPepp', '1d22239e62539d26ccdb1d114c0f27d8870f70d622f35de0ae2ad651840ee58a', 'a8b618c717683608', '', 0, 0);
INSERT INTO "users" VALUES (3, 'u3@p.it', 'Antonio', '61ed132df8733b14ae5210457df8f95b987a7d4b8cdf3daf2b5541679e7a0622', 'e818f0647b4e1fe0', 'LXBSMDTMSP2I5XFXIYRGFVWSFI', 1, 0);
INSERT INTO "users" VALUES (4, 'u4@p.it', 'Carmen', '1d22239e62539d26ccdb1d114c0f27d8870f70d622f35de0ae2ad651840ee58a', 'a8b618c717683608', '', 0, 0);

INSERT INTO "seats" ("row_label", "seatNumber", "category") VALUES 
('A', 1, 'premium'), ('A', 2, 'premium'), ('A', 3, 'premium'), ('A', 4, 'premium'), ('A', 5, 'premium'), ('A', 6, 'premium'), ('A', 7, 'premium'), ('A', 8, 'premium'),
('B', 1, 'premium'), ('B', 2, 'premium'), ('B', 3, 'premium'), ('B', 4, 'premium'), ('B', 5, 'premium'), ('B', 6, 'premium'), ('B', 7, 'premium'), ('B', 8, 'premium');

INSERT INTO "seats" ("row_label", "seatNumber", "category") VALUES 
('C', 1, 'normal'), ('C', 2, 'normal'), ('C', 3, 'normal'), ('C', 4, 'normal'), ('C', 5, 'normal'), ('C', 6, 'normal'), ('C', 7, 'normal'), ('C', 8, 'normal'), ('C', 9, 'normal'), ('C', 10, 'normal'), ('C', 11, 'normal'), ('C', 12, 'normal'),
('D', 1, 'normal'), ('D', 2, 'normal'), ('D', 3, 'normal'), ('D', 4, 'normal'), ('D', 5, 'normal'), ('D', 6, 'normal'), ('D', 7, 'normal'), ('D', 8, 'normal'), ('D', 9, 'normal'), ('D', 10, 'normal'), ('D', 11, 'normal'), ('D', 12, 'normal');

INSERT INTO "seats" ("row_label", "seatNumber", "category") VALUES 
('E', 1, 'normal'), ('E', 2, 'normal'), ('E', 3, 'normal'), ('E', 4, 'normal'), ('E', 5, 'normal'), ('E', 6, 'normal'), ('E', 7, 'normal'), ('E', 8, 'normal'), ('E', 9, 'normal'), ('E', 10, 'normal'), ('E', 11, 'normal'), ('E', 12, 'normal'), ('E', 13, 'normal'), ('E', 14, 'normal'), ('E', 15, 'normal'), ('E', 16, 'normal'),
('F', 1, 'normal'), ('F', 2, 'normal'), ('F', 3, 'normal'), ('F', 4, 'normal'), ('F', 5, 'normal'), ('F', 6, 'normal'), ('F', 7, 'normal'), ('F', 8, 'normal'), ('F', 9, 'normal'), ('F', 10, 'normal'), ('F', 11, 'normal'), ('F', 12, 'normal'), ('F', 13, 'normal'), ('F', 14, 'normal'), ('F', 15, 'normal'), ('F', 16, 'normal'),
('G', 1, 'normal'), ('G', 2, 'normal'), ('G', 3, 'normal'), ('G', 4, 'normal'), ('G', 5, 'normal'), ('G', 6, 'normal'), ('G', 7, 'normal'), ('G', 8, 'normal'), ('G', 9, 'normal'), ('G', 10, 'normal'), ('G', 11, 'normal'), ('G', 12, 'normal'), ('G', 13, 'normal'), ('G', 14, 'normal'), ('G', 15, 'normal'), ('G', 16, 'normal'),
('H', 1, 'normal'), ('H', 2, 'normal'), ('H', 3, 'normal'), ('H', 4, 'normal'), ('H', 5, 'normal'), ('H', 6, 'normal'), ('H', 7, 'normal'), ('H', 8, 'normal'), ('H', 9, 'normal'), ('H', 10, 'normal'), ('H', 11, 'normal'), ('H', 12, 'normal'), ('H', 13, 'normal'), ('H', 14, 'normal'), ('H', 15, 'normal'), ('H', 16, 'normal');

INSERT INTO "reservations" ("id", "userId") VALUES (1, 1);
INSERT INTO "reservations" ("id", "userId") VALUES (2, 1);
INSERT INTO "reservations" ("id", "userId") VALUES (3, 2);
INSERT INTO "reservations" ("id", "userId") VALUES (4, 2);

INSERT INTO "seatsReserved" VALUES (1, 'A', 1,1);
INSERT INTO "seatsReserved" VALUES (1, 'A', 2,1);
INSERT INTO "seatsReserved" VALUES (2, 'B', 5,1);
INSERT INTO "seatsReserved" VALUES (3, 'C', 10,2);
INSERT INTO "seatsReserved" VALUES (3, 'C', 11,2);
INSERT INTO "seatsReserved" VALUES (4, 'E', 14,2);
INSERT INTO "seatsReserved" VALUES (4, 'E', 15,2);
INSERT INTO "seatsReserved" VALUES (4, 'E', 16,2);

COMMIT;