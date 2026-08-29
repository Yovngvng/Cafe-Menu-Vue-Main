DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
        ALTER TABLE public.orders ADD COLUMN customer_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_type') THEN
        ALTER TABLE public.orders ADD COLUMN order_type text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='table_number') THEN
        ALTER TABLE public.orders ADD COLUMN table_number text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='note') THEN
        ALTER TABLE public.orders ADD COLUMN note text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='status') THEN
        ALTER TABLE public.orders ADD COLUMN status text DEFAULT 'در انتظار';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total') THEN
        ALTER TABLE public.orders ADD COLUMN total integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='items') THEN
        ALTER TABLE public.orders ADD COLUMN items jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_number') THEN
        ALTER TABLE public.orders ADD COLUMN order_number bigserial;
    END IF;
END $$;

UPDATE public.orders
SET
    customer_name = data->>'customer_name',
    order_type   = data->>'order_type',
    table_number = data->>'table_number',
    note         = data->>'note',
    status       = COALESCE(data->>'status', 'در انتظار'),
    total        = (data->>'total')::integer,
    items        = data->'items'
WHERE data IS NOT NULL;

ALTER TABLE public.orders DROP COLUMN IF EXISTS data;
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at);
