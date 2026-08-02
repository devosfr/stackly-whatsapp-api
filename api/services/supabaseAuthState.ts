import {
    AuthenticationCreds,
    BufferJSON,
    initAuthCreds,
    makeCacheableSignalKeyStore,
    SignalDataSet,
    SignalDataTypeMap
} from "@whiskeysockets/baileys";

import { createClient } from "@supabase/supabase-js";
import pino from "pino";

const logger = pino({ level: "silent" });

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

export async function useSupabaseAuthState(companyId: string) {

    const { data: auth } = await supabase
        .from("whatsapp_auth")
        .select("creds")
        .eq("company_id", companyId)
        .single();

    console.log("AUTH", auth);

    console.log("CREDS EXISTE?", !!auth?.creds);

    const creds: AuthenticationCreds = auth?.creds
        ? JSON.parse(
            JSON.stringify(auth.creds),
            BufferJSON.reviver
        )
        : initAuthCreds();

    const keys = {

        get: async (type: string, ids: string[]) => {
            console.log("KEYS.GET", type, ids);

            const { data } = await supabase
                .from("whatsapp_keys")
                .select("key,value")
                .eq("company_id", companyId)
                .eq("category", type)
                .in("key", ids);

            const result: Record<string, any> = {};

            for (const id of ids) {

                const row = data?.find((r: any) => r.key === id);

                result[id] = row?.value
                    ? JSON.parse(
                        JSON.stringify(row.value),
                        BufferJSON.reviver
                    )
                    : undefined;
            }

            return result;
        },

        set: async (data: SignalDataSet) => {
            
            console.log("KEYS.SET", JSON.stringify(data));
            
            const rows = [];

            console.log("KEYS.SET INICIO");



            console.log("ROWS", rows.length);
            
            for (const category in data) {
                const categoryKey = category as keyof SignalDataTypeMap;
                for (const id in data[categoryKey]) {
                    const value = data[categoryKey][id];
                    rows.push({
                        company_id: companyId,
                        category: categoryKey,
                        key: id,
                        value: value
                            ? JSON.parse(
                                JSON.stringify(
                                    value,
                                    BufferJSON.replacer
                                )
                            )
                            : null
                    });
                }
            }

            if (rows.length) {

                // const { error } = await supabase
                //     .from("whatsapp_keys")
                //     .upsert(rows);

                // if (error) {
                //     console.error(error);
                // }
                const { data, error } = await supabase
                    .from("whatsapp_keys")
                    .upsert(rows, {
                        onConflict: "company_id,category,key"
                    })
                    .select();

                console.log("ROWS:", rows.length);
                console.log("SALVOU:", data?.length);

                if (error) {
                    console.error(error);
                }
            }
        }

    };
    console.log("STATE");
    console.dir(
        makeCacheableSignalKeyStore(keys, logger),
        {
            depth: 3
        }
    );

    return {

        state: {
            creds,
            keys: makeCacheableSignalKeyStore(
                keys,
                logger
            )
        },
        saveCreds: async (newCreds: Partial<AuthenticationCreds>) =>{

            console.log("========== NEW CREDS ==========");
    console.dir(newCreds, { depth: null });

    Object.assign(creds, newCreds);

    console.log("========== REGISTERED ==========");
    console.log(creds.registered);

    console.log("========== KEYS ==========");
    console.log(Object.keys(newCreds));


           try{
             const { data, error } = await supabase
                .from("whatsapp_auth")
                .upsert(
                    {
                        company_id: companyId,
                        creds: JSON.parse(
                            JSON.stringify(creds, BufferJSON.replacer)
                        )
                    },
                    {
                        onConflict: "company_id"
                    }
                )
                .select();

            console.log("ERRO:", error);
            console.log("DATA:", data);

            console.log("CREDS SALVAS");
           }catch(e){
            
               console.error(e);
           }
        },
        //       saveCreds: async (newCreds: Partial<AuthenticationCreds>) => {
        //         

        //   console.log("========== CREDS ==========");

        //     console.log(Object.keys(newCreds));

        //     console.dir(newCreds, {
        //         depth: null
        //     });
        // 

        //             Object.assign(creds, newCreds);

        //             console.log("CREDS UPDATE");
        //             console.dir(creds, { depth: null });

        //             const { error } = await supabase
        //                 .from("whatsapp_auth")
        //                 .upsert(
        //                     {
        //                         company_id: companyId,
        //                         creds: JSON.parse(
        //                             JSON.stringify(creds, BufferJSON.replacer)
        //                         )
        //                     },
        //                     {
        //                         onConflict: "company_id"
        //                     }
        //                 );

        //             if (error) {
        //                 console.error("Erro salvando creds:", error);
        //             }
        //         },

        async resetWhatsappSession(companyId: string) {
            
            const { error } = await supabase
                .from("whatsapp_auth")
                .delete()
                .eq("company_id", companyId);

            if (error) {
                console.error(error);

            }

            const { error: error2 } = await supabase
                .from("whatsapp_keys")
                .delete()
                .eq("company_id", companyId);

            if (error2) {
                console.error(error2);
            }
        }

    };
}