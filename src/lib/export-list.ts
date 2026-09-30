import { emailFromPerson } from "@/lib/engine";
import { applyLocalFilters, COMPANIES, COMPANY_BY_ID, listMemberIds, PEOPLE } from "@/lib/leads-data";
import { asLeadKind, type SavedSearch } from "@/lib/types";

function xml(value: string) {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function cell(value: string | number) {
  if (typeof value === "number") return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  return `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`;
}

function sheet(headers: string[], rows: (string | number)[][]) {
  const body = [headers, ...rows].map((line) => `<Row>${line.map(cell).join("")}</Row>`).join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="List"><Table>${body}</Table></Worksheet>
</Workbook>`;
}

export function downloadList(item: SavedSearch) {
  const ids = new Set(listMemberIds(item));
  const kind = asLeadKind(item.kind);
  let headers: string[] = ["Name"];
  let rows: (string | number)[][] = [];
  if (kind === "person") {
    headers = ["Name", "Title", "Company", "Email", "Location"];
    rows = PEOPLE.filter((person) => ids.has(person.id)).map((person) => {
      const company = COMPANY_BY_ID[person.companyId];
      return [
        `${person.firstName} ${person.lastName}`,
        person.title,
        company?.name ?? "",
        company ? emailFromPerson(person.firstName, person.lastName, company.domain) : "",
        person.location,
      ];
    });
  } else if (kind === "company") {
    headers = ["Company", "Domain", "Industry", "Headcount", "Location"];
    rows = COMPANIES.filter((company) => ids.has(company.id)).map((company) => [
      company.name,
      company.domain,
      company.industry,
      company.sizeLabel,
      company.location,
    ]);
  } else {
    headers = ["City", "Country", "People", "Companies"];
    rows = applyLocalFilters({})
      .filter((place) => ids.has(place.id))
      .map((place) => [place.city, place.country, place.people.length, place.companies.length]);
  }
  const blob = new Blob([sheet(headers, rows)], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${item.name.replace(/\s+/g, "-").toLowerCase()}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
