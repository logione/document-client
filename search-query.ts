export class SearchQuery {
    text?: string
    sortColumn?: string
    sortAsc?: boolean
    limit?: number
    skip?: number
    complete?: boolean
    columnFilters?: ColumnFilter[] = []
}

export interface ColumnFilter {
    column: string
    value: string | number | boolean | { min: number, max: number }
    match: boolean
}
