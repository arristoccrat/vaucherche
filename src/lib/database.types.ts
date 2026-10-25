// Hand-written from the live schema (24 Oct 2026, plus admin/sql/*) until `npm run gen:types`
// can be run against the project; that command overwrites this file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      fetch_log: {
        Row: {
          domain: string;
          error: string | null;
          fetched_at: string | null;
          id: number;
          ok: boolean | null;
          status_code: number | null;
          url: string | null;
        };
        Insert: {
          domain: string;
          error?: string | null;
          fetched_at?: string | null;
          id?: number;
          ok?: boolean | null;
          status_code?: number | null;
          url?: string | null;
        };
        Update: {
          domain?: string;
          error?: string | null;
          fetched_at?: string | null;
          id?: number;
          ok?: boolean | null;
          status_code?: number | null;
          url?: string | null;
        };
        Relationships: [];
      };
      shops: {
        Row: {
          affiliate_merchant_id: string | null;
          affiliate_network: string | null;
          category: string | null;
          category_confidence: number | null;
          confidence: number | null;
          cover_url: string | null;
          created_at: string | null;
          description: string | null;
          discovery_source: string;
          domain: string;
          gift_appeal: string | null;
          gift_appeal_rank: number | null;
          id: string;
          logo_url: string | null;
          name: string;
          published: boolean | null;
          slug: string;
          status: string;
          status_reason: string | null;
          subcategory: string | null;
          updated_at: string | null;
          voucher_type: string | null;
          voucher_url: string | null;
          voucher_url_note: string | null;
          voucher_url_verified: boolean | null;
        };
        Insert: {
          affiliate_merchant_id?: string | null;
          affiliate_network?: string | null;
          category?: string | null;
          category_confidence?: number | null;
          confidence?: number | null;
          cover_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          discovery_source: string;
          domain: string;
          gift_appeal?: string | null;
          gift_appeal_rank?: never;
          id?: string;
          logo_url?: string | null;
          name: string;
          published?: boolean | null;
          slug: string;
          status?: string;
          status_reason?: string | null;
          subcategory?: string | null;
          updated_at?: string | null;
          voucher_type?: string | null;
          voucher_url?: string | null;
          voucher_url_note?: string | null;
          voucher_url_verified?: boolean | null;
        };
        Update: {
          affiliate_merchant_id?: string | null;
          affiliate_network?: string | null;
          category?: string | null;
          category_confidence?: number | null;
          confidence?: number | null;
          cover_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          discovery_source?: string;
          domain?: string;
          gift_appeal?: string | null;
          gift_appeal_rank?: never;
          id?: string;
          logo_url?: string | null;
          name?: string;
          published?: boolean | null;
          slug?: string;
          status?: string;
          status_reason?: string | null;
          subcategory?: string | null;
          updated_at?: string | null;
          voucher_type?: string | null;
          voucher_url?: string | null;
          voucher_url_note?: string | null;
          voucher_url_verified?: boolean | null;
        };
        Relationships: [];
      };
      voucher_offers: {
        Row: {
          currency: string | null;
          custom_amount: boolean | null;
          delivery_methods: string[] | null;
          denominations: number[] | null;
          extracted_at: string | null;
          extraction_confidence: number | null;
          human_edited_at: string | null;
          id: string;
          is_digital: boolean | null;
          is_physical: boolean | null;
          max_value: number | null;
          min_value: number | null;
          personalisable: boolean | null;
          raw_extract: Json | null;
          shop_id: string;
          terms_url: string | null;
          validity_months: number | null;
          verified_at: string | null;
          verified_by_human: boolean | null;
        };
        Insert: {
          currency?: string | null;
          custom_amount?: boolean | null;
          delivery_methods?: string[] | null;
          denominations?: number[] | null;
          extracted_at?: string | null;
          extraction_confidence?: number | null;
          human_edited_at?: string | null;
          id?: string;
          is_digital?: boolean | null;
          is_physical?: boolean | null;
          max_value?: number | null;
          min_value?: number | null;
          personalisable?: boolean | null;
          raw_extract?: Json | null;
          shop_id: string;
          terms_url?: string | null;
          validity_months?: number | null;
          verified_at?: string | null;
          verified_by_human?: boolean | null;
        };
        Update: {
          currency?: string | null;
          custom_amount?: boolean | null;
          delivery_methods?: string[] | null;
          denominations?: number[] | null;
          extracted_at?: string | null;
          extraction_confidence?: number | null;
          human_edited_at?: string | null;
          id?: string;
          is_digital?: boolean | null;
          is_physical?: boolean | null;
          max_value?: number | null;
          min_value?: number | null;
          personalisable?: boolean | null;
          raw_extract?: Json | null;
          shop_id?: string;
          terms_url?: string | null;
          validity_months?: number | null;
          verified_at?: string | null;
          verified_by_human?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "voucher_offers_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      voucher_products: {
        Row: {
          availability: string | null;
          breadcrumb: string | null;
          currency: string | null;
          description: string | null;
          fetched_at: string | null;
          found_at: string | null;
          id: string;
          image_url: string | null;
          is_digital: boolean | null;
          is_physical: boolean | null;
          links: Json | null;
          meta: Json | null;
          price: number | null;
          price_bgn: number | null;
          raw: Json | null;
          raw_text: string | null;
          shop_id: string;
          sku: string | null;
          source: string | null;
          title: string | null;
          url: string;
        };
        Insert: {
          availability?: string | null;
          breadcrumb?: string | null;
          currency?: string | null;
          description?: string | null;
          fetched_at?: string | null;
          found_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_digital?: boolean | null;
          is_physical?: boolean | null;
          links?: Json | null;
          meta?: Json | null;
          price?: number | null;
          price_bgn?: number | null;
          raw?: Json | null;
          raw_text?: string | null;
          shop_id: string;
          sku?: string | null;
          source?: string | null;
          title?: string | null;
          url: string;
        };
        Update: {
          availability?: string | null;
          breadcrumb?: string | null;
          currency?: string | null;
          description?: string | null;
          fetched_at?: string | null;
          found_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_digital?: boolean | null;
          is_physical?: boolean | null;
          links?: Json | null;
          meta?: Json | null;
          price?: number | null;
          price_bgn?: number | null;
          raw?: Json | null;
          raw_text?: string | null;
          shop_id?: string;
          sku?: string | null;
          source?: string | null;
          title?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voucher_products_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      shop_voucher_range: {
        Row: {
          any_in_stock: boolean | null;
          category: string | null;
          cover_url: string | null;
          currency: string | null;
          denominations: number[] | null;
          description: string | null;
          domain: string | null;
          gift_appeal: string | null;
          id: string | null;
          denominations_eur: number[] | null;
          logo_url: string | null;
          max_bgn: number | null;
          max_eur: number | null;
          min_bgn: number | null;
          min_eur: number | null;
          name: string | null;
          priced_count: number | null;
          product_count: number | null;
          published: boolean | null;
          slug: string | null;
          subcategory: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
