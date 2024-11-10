import pandas as pd
"""
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
print("Number of rows in the filtered DataFrame:", filtered_row_count)"""
"""
file_path2 = '/Users/averykleptach/Desktop/Fall 2024/datavis/project/aklepta19.github.io/Gun_violence_clean3.csv'
df2 = pd.read_csv(file_path2)
df2['total_casualties'] = df2['n_killed'] + df2['n_injured']
# Convert 'date' column to datetime format
df2['date'] = pd.to_datetime(df2['date'], errors='coerce')
# Map month numbers to month names
month_map = {1: "January", 2: "February", 3: "March", 4: "April", 5: "May",
            6: "June", 7: "July", 8: "August", 9: "September", 10: "October",
            11: "November", 12: "December"}
df2['month_name'] = df2['month'].map(month_map)

# Create 'quarter' and 'month' columns based on the 'date' column
df2['quarter'] = df2['date'].dt.quarter
df2['month'] = df2['date'].dt.month
row_count = df2.shape[0]
print("Number of rows in the filtered DataFrame:", row_count)
# Save the updated dataframe to a new CSV file
#df2.to_csv('/path/to/your/Gun_violence_with_quarter_month.csv', index=False)
df2.to_csv('Gun_violence_clean3.csv', index=False)
print(df2[['incident_id', 'date', 'quarter', 'month_name']].head())"""
#df_filtered.info()


import pandas as pd

# Original gun data
gun_data = pd.read_csv('/Users/averykleptach/Desktop/Fall 2024/datavis/project/aklepta19.github.io/Gun_violence_clean3.csv')

# Provided rating data
rating_data = {
    'year': [2013, 2013, 2013, 2013, 2013, 2013, 2013, 2013,
             2014, 2014, 2014, 2014, 2014, 2014, 2014, 2014,
             2015, 2015, 2015, 2015, 2015, 2015, 2015, 2015,
             2016, 2016, 2016, 2016, 2016, 2016, 2016, 2016,
             2017, 2017, 2017, 2017, 2017, 2017, 2017, 2017],
    'state': ["Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "West Virginia",
              "Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "West Virginia",
              "Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "West Virginia",
              "Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "West Virginia",
              "Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "West Virginia"],
    'rating': ["B-", "F", "F", "A-", "F", "F", "D", "F",
               "B-", "F", "F", "A-", "F", "F", "D", "F",
               "B", "F", "F", "A-", "F", "F", "D", "D-",
               "B", "F", "F", "A-", "D-", "F", "D", "F",
               "B", "F", "F", "A-", "D-", "F", "D", "F"]
}

# Convert to DataFrame
rating_df = pd.DataFrame(rating_data)

# Merge this with the existing gun_data on 'year' and 'state' to add 'rating' column
gun_data_with_rating = pd.merge(gun_data, rating_df, on=['year', 'state'], how='left')

# Save the merged data with the new 'rating' column to a CSV file
output_path = 'gun_data_with_rating.csv'
gun_data_with_rating.to_csv(output_path, index=False)

print("Data saved to:", output_path)

# Display the first few rows to confirm the new column addition

print(gun_data_with_rating.head())

