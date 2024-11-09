import pandas as pd

def filter_and_clean_subject_suspect(df):
    # Identify relevant indices where `participant_type` contains "Subject-Suspect"
    df['relevant_indices'] = df['participant_type'].apply(
        lambda x: [i for i, v in enumerate(x.split('||')) if "Subject-Suspect" in v] if isinstance(x, str) else []
    )
    
    # Filter and clean `participant_age_group` and `participant_gender`, removing "number::" prefix
    df['participant_age_group'] = df.apply(
        lambda row: ' '.join([v.split('::', 1)[1] for i, v in enumerate(row['participant_age_group'].split('||')) 
                            if i in row['relevant_indices'] and len(v.split('::', 1)) > 1])
        if isinstance(row['participant_age_group'], str) else None, axis=1
    )
    
    df['participant_gender'] = df.apply(
        lambda row: ' '.join([v.split('::', 1)[1] for i, v in enumerate(row['participant_gender'].split('||')) 
                            if i in row['relevant_indices'] and len(v.split('::', 1)) > 1])
        if isinstance(row['participant_gender'], str) else None, axis=1
    )
    
    # Keep only "Subject-Suspect" in `participant_type`, ensuring all relevant instances are kept
    df['participant_type'] = df.apply(
        lambda row: ' '.join([v.split('::', 1)[1] for i, v in enumerate(row['participant_type'].split('||')) 
                            if i in row['relevant_indices'] and "Subject-Suspect" in v and len(v.split('::', 1)) > 1])
        if isinstance(row['participant_type'], str) else None, axis=1
    )
    
    
    # Drop the helper column
    df = df.drop(columns=['relevant_indices'])
    
    return df



# Load the CSV file into a DataFrame
file_path = '/Users/averykleptach/Desktop/Fall 2024/datavis/project/aklepta19.github.io/Gun_violence_SE_clean1.csv'

df = pd.read_csv(file_path)
df['total_casualties'] = df['n_killed'] + df['n_injured']
df['date'] = pd.to_datetime(df['date'], errors='coerce').dt.date
# Apply the function to filter the dataset
df_filtered = filter_and_clean_subject_suspect(df)
df_filtered = df_filtered[df_filtered['participant_type'].str.contains("Subject-Suspect", na=False)]

#print(df_filtered.head())
print(df_filtered[['incident_id', 'date', 'participant_age_group', 'participant_gender', 'participant_type']].head())
df_filtered.to_csv('suspect_file.csv', index=False)
# Number of rows in the filtered DataFrame
filtered_row_count = df_filtered.shape[0]
print("Number of rows in the filtered DataFrame:", filtered_row_count)


#df_filtered.info()

