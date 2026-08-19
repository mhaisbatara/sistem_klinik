/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file 20260818000000_add_pelayanan_medis_navigation.js
 * @description Migration script untuk menambahkan menu Pelayanan Medis (Pemeriksaan Dokter & Rekam Medis) ke mst_navigation dan user_navigation.
 */

export async function up(knex) {
  const updatedMenu = [
    {
      label: "HOME",
      items: [
        { label: "Dashboard", icon: "pi pi-fw pi-home", to: "/dashboard" },
        { label: "Antrian Awal", icon: "pi pi-fw pi-list", to: "/antrian-awal" },
        { label: "Pendaftaran", icon: "pi pi-fw pi-file", to: "/pendaftaran" },
        { label: "Antrian", icon: "pi pi-fw pi-ticket", to: "/antrian" },
        { label: "Display TV", icon: "pi pi-fw pi-desktop", to: "/display-tv" }
      ]
    },
    {
      label: "PELAYANAN MEDIS",
      items: [
        { label: "Pemeriksaan Dokter", icon: "pi pi-fw pi-user-edit", to: "/pemeriksaan-dokter" },
        { label: "Rekam Medis", icon: "pi pi-fw pi-folder", to: "/rekam-medis" }
      ]
    },
    {
      label: "SETUP",
      items: [
        { label: "Users", icon: "pi pi-fw pi-users", to: "/setup/users" },
        { label: "Config Perusahaan", icon: "pi pi-fw pi-building", to: "/setup/config" }
      ]
    }
  ];

  const menuJson = JSON.stringify(updatedMenu);

  const hasMstNav = await knex.schema.hasTable("mst_navigation");
  if (hasMstNav) {
    const mstRows = await knex("mst_navigation").select("id", "menu");
    for (const row of mstRows) {
      try {
        let menuArr = JSON.parse(row.menu || "[]");
        const hasPelayanan = menuArr.some((m) => m.label === "PELAYANAN MEDIS");
        if (!hasPelayanan) {
          menuArr.push({
            label: "PELAYANAN MEDIS",
            items: [
              { label: "Pemeriksaan Dokter", icon: "pi pi-fw pi-user-edit", to: "/pemeriksaan-dokter" },
              { label: "Rekam Medis", icon: "pi pi-fw pi-folder", to: "/rekam-medis" }
            ]
          });
          await knex("mst_navigation").where({ id: row.id }).update({ menu: JSON.stringify(menuArr) });
        }
      } catch (e) {
        await knex("mst_navigation").where({ id: row.id }).update({ menu: menuJson });
      }
    }
  }

  const hasUserNav = await knex.schema.hasTable("user_navigation");
  if (hasUserNav) {
    const userRows = await knex("user_navigation").select("id", "menu");
    for (const row of userRows) {
      try {
        let menuArr = JSON.parse(row.menu || "[]");
        const hasPelayanan = menuArr.some((m) => m.label === "PELAYANAN MEDIS");
        if (!hasPelayanan) {
          menuArr.push({
            label: "PELAYANAN MEDIS",
            items: [
              { label: "Pemeriksaan Dokter", icon: "pi pi-fw pi-user-edit", to: "/pemeriksaan-dokter" },
              { label: "Rekam Medis", icon: "pi pi-fw pi-folder", to: "/rekam-medis" }
            ]
          });
          await knex("user_navigation").where({ id: row.id }).update({ menu: JSON.stringify(menuArr) });
        }
      } catch (e) {
        await knex("user_navigation").where({ id: row.id }).update({ menu: menuJson });
      }
    }
  }
}

export async function down(knex) {
  // no-op down migration
}
